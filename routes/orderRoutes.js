const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authController.protect);

router.route('/')
    .get(orderController.getOrders)
    .post(orderController.createOrder);

router.route('/:id/status')
    .patch(orderController.updateOrderStatus);

module.exports = router;
