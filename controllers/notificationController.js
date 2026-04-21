const notificationService = require('../services/notificationService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/apiResponse');

/**
 * GET /api/notifications
 * Returns paginated notifications + unread count for the authenticated user.
 */
exports.getNotifications = catchAsync(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const result = await notificationService.getNotifications(req.user.id, page, limit);
    sendResponse(res, 200, 'Notifications fetched', result);
});

/**
 * GET /api/notifications/unread-count
 * Lightweight endpoint for polling the bell badge count.
 */
exports.getUnreadCount = catchAsync(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user.id);
    sendResponse(res, 200, 'Unread count fetched', { unreadCount: count });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
exports.markRead = catchAsync(async (req, res) => {
    const notification = await notificationService.markRead(req.params.id, req.user.id);
    sendResponse(res, 200, 'Notification marked as read', { notification });
});

/**
 * PATCH /api/notifications/read-all
 * Mark all of the current user's notifications as read.
 */
exports.markAllRead = catchAsync(async (req, res) => {
    await notificationService.markAllRead(req.user.id);
    sendResponse(res, 200, 'All notifications marked as read');
});
