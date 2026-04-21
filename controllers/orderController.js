const Order = require('../models/Order');
const Product = require('../models/Product');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendResponse = require('../utils/apiResponse');
const notificationService = require('../services/notificationService');

exports.createOrder = catchAsync(async (req, res, next) => {
    // 1. Get product details
    const product = await Product.findById(req.body.product).populate('seller', 'name');
    if (!product) return next(new AppError('Product not found', 404));

    if (product.quantityAvailable < req.body.quantity) {
        return next(new AppError('Not enough quantity available', 400));
    }

    // Prevent self-buying
    if (product.seller._id.toString() === req.user.id) {
        return next(new AppError('You cannot purchase your own product listings.', 403));
    }

    // Ensure valid integer quantity
    if (req.body.quantity <= 0) return next(new AppError('Quantity must be greater than zero', 400));

    // 2. Compute final price based on standard price or negotiation outcome
    const pricePerUnit = req.body.agreedPrice || product.price;
    const totalPrice = pricePerUnit * req.body.quantity;

    // 3. Create the order
    const order = await Order.create({
        product: req.body.product,
        buyer: req.user.id,
        seller: product.seller._id,
        quantity: req.body.quantity,
        totalPrice: totalPrice,
        status: 'pending'
    });

    // 4. Update Product inventory
    product.quantityAvailable -= req.body.quantity;
    await product.save();

    // 5. 🔔 Notify the farmer — order placed, awaiting payment
    notificationService.createNotification({
        userId: product.seller._id,
        type: 'purchase',
        title: '🛒 New Order Received!',
        message: `${req.user.name} placed an order for ${req.body.quantity} ${product.unit} of "${product.name}". Awaiting payment.`,
        data: {
            orderId: order._id,
            productId: product._id,
            productName: product.name,
            buyerName: req.user.name,
            quantity: req.body.quantity,
            totalPrice,
        },
    }).catch(err => console.warn('[orderController] Notification failed (non-fatal):', err.message));

    sendResponse(res, 201, 'Order placed successfully', { order });
});

exports.getOrders = catchAsync(async (req, res, next) => {
    let filter = { $or: [{ buyer: req.user.id }, { seller: req.user.id }] };

    const orders = await Order.find(filter)
        .populate('product', 'name category unit')
        .populate('buyer', 'name phone profileImage')
        .populate('seller', 'name phone profileImage');

    sendResponse(res, 200, 'Orders retrieved successfully', {
        results: orders.length,
        orders
    });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('product', 'name').populate('buyer', 'name');

    if (!order) return next(new AppError('Order not found', 404));

    if (order.seller.toString() !== req.user.id && !req.user.isAdmin) {
        return next(new AppError('You can only update your own sales orders', 403));
    }

    const prevStatus = order.status;
    order.status = req.body.status;
    await order.save();

    // 🔔 Notify the buyer of the status change
    notificationService.createNotification({
        userId: order.buyer._id,
        type: 'order_status',
        title: `📦 Order ${req.body.status.charAt(0).toUpperCase() + req.body.status.slice(1)}`,
        message: `Your order for "${order.product?.name || 'your product'}" has been updated to ${req.body.status}.`,
        data: { orderId: order._id, status: req.body.status, previousStatus: prevStatus },
    }).catch(err => console.warn('[orderController] Status notification failed (non-fatal):', err.message));

    sendResponse(res, 200, 'Order status updated', { order });
});
