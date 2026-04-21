const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictToAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin routes are highly restricted
router.use(protect, restrictToAdmin);

router.get('/analytics', adminController.getAnalyticsDashboard);
router.get('/verifications', adminController.getPendingVerifications);
router.patch('/verify/:id/approve', adminController.approveVerification);
router.patch('/verify/:id/reject', adminController.rejectVerification);
router.get('/users', adminController.getAllUsers);
router.get('/orders', adminController.getAllOrders);

module.exports = router;
