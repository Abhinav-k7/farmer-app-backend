const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// ── Read-only ────────────────────────────────────────────────
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);

// ── Mark as read ─────────────────────────────────────────────
// IMPORTANT: read-all must be registered BEFORE /:id/read
// to prevent Express matching "read-all" as an :id param
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
