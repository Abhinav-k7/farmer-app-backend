const Negotiation = require('../models/Negotiation');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendResponse = require('../utils/apiResponse');
const { createNotification } = require('../services/notificationService');

// Helper: re-fetch a fully populated negotiation by ID
const getPopulated = (id) =>
    Negotiation.findById(id)
        .populate('product', 'name category unit price isNegotiable')
        .populate('buyer', 'name phone profileImage')
        .populate('seller', 'name phone profileImage')
        .populate('lastOfferBy', 'name');

// ── POST /negotiations ───────────────────────────────────────
exports.initiateNegotiation = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.body.product);
    if (!product) return next(new AppError('Product not found', 404));

    if (!product.isNegotiable) {
        return next(new AppError('This product is not open for negotiation', 400));
    }

    // Prevent duplicate active negotiations for the same buyer+product
    const existing = await Negotiation.findOne({
        product: product._id,
        buyer: req.user.id,
        status: { $nin: ['accepted', 'rejected', 'completed'] }
    });
    if (existing) {
        return next(new AppError('You already have an active negotiation for this product.', 400));
    }

    const raw = await Negotiation.create({
        product: product._id,
        buyer: req.user.id,
        seller: product.seller,
        proposedPrice: req.body.proposedPrice,
        quantity: req.body.quantity,
        lastOfferBy: req.user.id,  // buyer initiated
        messages: [{
            sender: req.user.id,
            message: req.body.message || `Proposed price: ₹${req.body.proposedPrice} for ${req.body.quantity} ${product.unit}`
        }]
    });

    // Return fully populated doc so frontend has all fields immediately
    const negotiation = await getPopulated(raw._id);

    // 🔔 Notify the seller that a buyer started a negotiation
    createNotification({
        userId: product.seller,
        type: 'purchase',
        title: '💬 New Negotiation Offer',
        message: `${negotiation.buyer?.name || 'A buyer'} wants to negotiate ₹${req.body.proposedPrice} for ${product.name}.`,
        data: { negotiationId: raw._id.toString(), productId: product._id.toString() }
    }).catch(() => {}); // non-blocking

    sendResponse(res, 201, 'Negotiation initiated', { negotiation });
});

// ── GET /negotiations ────────────────────────────────────────
exports.getNegotiations = catchAsync(async (req, res, next) => {
    const filter = { $or: [{ buyer: req.user.id }, { seller: req.user.id }] };

    const negotiations = await Negotiation.find(filter)
        .populate('product', 'name category unit price isNegotiable')
        .populate('buyer', 'name phone profileImage')
        .populate('seller', 'name phone profileImage')
        .populate('lastOfferBy', 'name')
        .sort('-createdAt');

    sendResponse(res, 200, 'Negotiations fetched', {
        results: negotiations.length,
        negotiations
    });
});

// ── PATCH /negotiations/:id ──────────────────────────────────
exports.respondToNegotiation = catchAsync(async (req, res, next) => {
    const negotiation = await Negotiation.findById(req.params.id);
    if (!negotiation) return next(new AppError('Negotiation not found', 404));

    // Only buyer or seller may interact
    const buyerId  = negotiation.buyer.toString();
    const sellerId = negotiation.seller.toString();
    const myId     = req.user.id.toString();

    const isBuyer  = buyerId  === myId;
    const isSeller = sellerId === myId;
    if (!isBuyer && !isSeller) {
        return next(new AppError('You are not part of this negotiation.', 403));
    }

    if (['completed', 'rejected'].includes(negotiation.status)) {
        return next(new AppError('This negotiation is already closed', 400));
    }

    const { status, proposedPrice, message } = req.body;

    // Who is the OTHER party (for notifications)?
    const otherPartyId = isBuyer ? sellerId : buyerId;

    if (status === 'accepted') {
        // Accept guard: can't accept your own offer
        // Only enforce this if lastOfferBy is set (new-style negotiations)
        const lastOfferById = negotiation.lastOfferBy?.toString();
        if (lastOfferById && lastOfferById === myId) {
            return next(new AppError('You cannot accept your own offer. Wait for the other party to respond.', 400));
        }
        if (negotiation.status === 'accepted') {
            return next(new AppError('This negotiation was already accepted.', 400));
        }
        negotiation.status = 'accepted';
        negotiation.messages.push({
            sender: req.user.id,
            message: `✅ Offer of ₹${negotiation.proposedPrice} accepted.`
        });

        // 🔔 Notify the OTHER party that offer was accepted
        createNotification({
            userId: otherPartyId,
            type: 'payment',
            title: '✅ Negotiation Accepted!',
            message: `${req.user.name} accepted the offer of ₹${negotiation.proposedPrice}.`,
            data: { negotiationId: negotiation._id.toString() }
        }).catch(() => {});

    } else if (status === 'rejected') {
        negotiation.status = 'rejected';
        negotiation.messages.push({
            sender: req.user.id,
            message: message || '❌ Offer rejected.'
        });

        // 🔔 Notify the OTHER party that offer was rejected
        createNotification({
            userId: otherPartyId,
            type: 'order_status',
            title: '❌ Negotiation Rejected',
            message: `${req.user.name || 'The other party'} rejected the negotiation offer.`,
            data: { negotiationId: negotiation._id.toString() }
        }).catch(() => {});

    } else {
        // Counter-offer / plain message
        if (proposedPrice !== undefined && proposedPrice !== null) {
            negotiation.proposedPrice = Number(proposedPrice);
            negotiation.lastOfferBy = req.user.id;  // track who countered
        }
        if (status) negotiation.status = status;

        if (message && message.trim()) {
            negotiation.messages.push({
                sender: req.user.id,
                message: message.trim()
            });
        }

        // 🔔 Notify the OTHER party of the counter-offer
        if (proposedPrice !== undefined || (message && message.trim())) {
            createNotification({
                userId: otherPartyId,
                type: 'market',
                title: '🔄 Counter Offer Received',
                message: proposedPrice !== undefined
                    ? `${req.user.name || 'Other party'} countered with ₹${proposedPrice}.`
                    : `${req.user.name || 'Other party'} sent a message.`,
                data: { negotiationId: negotiation._id.toString() }
            }).catch(() => {});
        }
    }

    await negotiation.save();

    // Return fully populated doc
    const updated = await getPopulated(negotiation._id);
    sendResponse(res, 200, 'Negotiation updated', { negotiation: updated });
});
