const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendResponse = require('../utils/apiResponse');
const Order = require('../models/Order');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const dotenv = require('dotenv');
const notificationService = require('../services/notificationService');

dotenv.config();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createPaymentOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findById(req.params.orderId);
    if (!order) return next(new AppError('Order not found', 404));

    if (order.status === 'completed' || order.paymentStatus === 'completed') {
        return next(new AppError('Order is already paid for', 400));
    }

    // Initialize Payment Gateway securely via Razorpay
    const options = {
      amount: parseInt(order.totalPrice) * 100, // min subunit (paise)
      currency: "INR",
      receipt: `receipt_${order._id}`
    };

    let paymentOrder;
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.includes('fake')) {
        // Fallback to mock order if user is just testing without real keys
        paymentOrder = {
            id: `pay_mock_${Date.now()}`,
            currency: 'INR',
            amount: options.amount
        };
    } else {
        paymentOrder = await razorpay.orders.create(options);
    }
    
    sendResponse(res, 200, 'Payment ordered created successfully', { 
        paymentData: paymentOrder, 
        keyId: process.env.RAZORPAY_KEY_ID 
    });
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Verify signature cryptographically
    let expectedSig = '';
    
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.includes('fake')) {
        expectedSig = razorpay_signature; // Bypass for fake test flows
    } else {
        expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                            .update(razorpay_order_id + "|" + razorpay_payment_id)
                            .digest('hex');
    }

    if (razorpay_signature !== expectedSig) {
        return next(new AppError('Payment verification failed. Signatures mismatched.', 400));
    }

    // Process valid payment
    const order = await Order.findById(req.params.orderId)
        .populate('product', 'name unit')
        .populate('buyer', 'name')
        .populate('seller', 'name');

    order.paymentStatus = 'completed';
    order.paymentId = razorpay_payment_id;
    order.status = 'confirmed';
    await order.save();

    const productName = order.product?.name || 'your product';
    const buyerName  = order.buyer?.name  || 'A buyer';

    // 🔔 Notify the FARMER — payment received, sale confirmed
    notificationService.createNotification({
        userId: order.seller._id,
        type: 'payment',
        title: '💰 Payment Received!',
        message: `${buyerName} completed payment for "${productName}". Your order is now confirmed.`,
        data: {
            orderId: order._id,
            productName,
            buyerName,
            totalPrice: order.totalPrice,
            paymentId: razorpay_payment_id,
        },
    }).catch(err => console.warn('[paymentController] Farmer notification failed (non-fatal):', err.message));

    // 🔔 Notify the BUYER — purchase confirmed
    notificationService.createNotification({
        userId: order.buyer._id,
        type: 'payment',
        title: '🎉 Purchase Confirmed!',
        message: `Your payment for "${productName}" was successful. The farmer has been notified.`,
        data: {
            orderId: order._id,
            productName,
            totalPrice: order.totalPrice,
            paymentId: razorpay_payment_id,
        },
    }).catch(err => console.warn('[paymentController] Buyer notification failed (non-fatal):', err.message));

    sendResponse(res, 200, 'Payment verified successfully', { order });
});
