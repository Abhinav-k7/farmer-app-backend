const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Notification must belong to a user'],
        },
        type: {
            type: String,
            enum: ['purchase', 'payment', 'follow', 'market', 'order_status'],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        // Flexible JSON payload for deep-linking / extra context
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────
// Primary query: all notifications for a user, newest first
notificationSchema.index({ userId: 1, createdAt: -1 });
// Badge count query: unread per user
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
