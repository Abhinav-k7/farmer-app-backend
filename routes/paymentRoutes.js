const express = require('express');
const paymentController = require('../controllers/paymentController');
const authController = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

// Routes for creating and verifying payments against an order
router.route('/create')
    .post(paymentController.createPaymentOrder);

router.route('/verify')
    .post(paymentController.verifyPayment);

module.exports = router;
