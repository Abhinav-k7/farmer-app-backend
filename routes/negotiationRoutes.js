const express = require('express');
const negotiationController = require('../controllers/negotiationController');
const authController = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authController.protect);

router.route('/')
    .get(negotiationController.getNegotiations)
    .post(negotiationController.initiateNegotiation);

router.route('/:id')
    .patch(negotiationController.respondToNegotiation);

module.exports = router;
