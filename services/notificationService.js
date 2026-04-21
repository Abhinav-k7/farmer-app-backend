/**
 * services/notificationService.js
 *
 * Central business logic for the notification system.
 * Every notification is:
 *   1. Persisted in MongoDB (source of truth — works for offline users)
 *   2. Pushed via Socket.IO if the user is currently connected
 */

const Notification = require('../models/Notification');
const AppError = require('../utils/appError');

// Lazy-load to avoid circular import issues during startup
const getIO = () => {
    try {
        return require('../utils/socket').getIO();
    } catch {
        return null; // Socket not yet ready (app startup race)
    }
};

// ─────────────────────────────────────────────────────────────
// CREATE  — Save + emit
// ─────────────────────────────────────────────────────────────

/**
 * Create a notification and optionally push it in real-time.
 * @param {object} opts
 * @param {string}  opts.userId   — receiver's Mongoose ObjectId (as string or ObjectId)
 * @param {string}  opts.type     — 'purchase' | 'payment' | 'follow' | 'market' | 'order_status'
 * @param {string}  opts.title
 * @param {string}  opts.message
 * @param {object=} opts.data     — extra JSON payload (orderId, productName, …)
 * @returns {Promise<Notification>}
 */
exports.createNotification = async ({ userId, type, title, message, data = {} }) => {
    // 1. Persist
    const notification = await Notification.create({ userId, type, title, message, data });

    // 2. Emit (non-blocking — failure never breaks the calling flow)
    try {
        const io = getIO();
        if (io) {
            io.to(userId.toString()).emit('notification', {
                _id: notification._id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                isRead: false,
                createdAt: notification.createdAt,
            });
        }
    } catch (socketErr) {
        console.warn('[notificationService] Socket emit failed (non-fatal):', socketErr.message);
    }

    return notification;
};

// ─────────────────────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────────────────────

/**
 * Get paginated notifications for a user, newest first.
 */
exports.getNotifications = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
        Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
        Notification.countDocuments({ userId }),
        Notification.countDocuments({ userId, isRead: false }),
    ]);

    return {
        notifications,
        total,
        unreadCount,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
    };
};

/**
 * Get just the unread count for the bell badge.
 */
exports.getUnreadCount = async (userId) => {
    return Notification.countDocuments({ userId, isRead: false });
};

// ─────────────────────────────────────────────────────────────
// MARK READ
// ─────────────────────────────────────────────────────────────

/**
 * Mark a single notification as read (only if it belongs to the requesting user).
 */
exports.markRead = async (notifId, userId) => {
    const notif = await Notification.findOneAndUpdate(
        { _id: notifId, userId },
        { isRead: true },
        { new: true }
    );
    if (!notif) throw new AppError('Notification not found', 404);
    return notif;
};

/**
 * Mark ALL notifications for a user as read.
 */
exports.markAllRead = async (userId) => {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
};
