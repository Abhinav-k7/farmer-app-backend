const profileService = require('../services/profileService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/apiResponse');
const AppError = require('../utils/appError');

// ─────────────────────────────────────────────
// Own Profile
// ─────────────────────────────────────────────

exports.getMe = catchAsync(async (req, res, next) => {
    const user = await profileService.getProfile(req.user.id);
    sendResponse(res, 200, 'Profile fetched', { user });
});

exports.updateMe = catchAsync(async (req, res, next) => {
    let updateData = { ...req.body };
    if (req.file) {
        updateData.profileImage = req.file.path;
    }
    const updatedUser = await profileService.updateProfile(req.user.id, updateData);
    sendResponse(res, 200, 'Profile updated', { user: updatedUser });
});

exports.submitVerification = catchAsync(async (req, res, next) => {
    let documentUrl = req.body.documentUrl;
    if (req.file) {
        documentUrl = req.file.path;
    }
    if (!documentUrl) return next(new AppError('Please provide a document to verify', 400));
    const user = await profileService.submitVerification(req.user.id, documentUrl);
    sendResponse(res, 200, 'Verification submitted successfully', { user });
});

// ─────────────────────────────────────────────
// Public Profile
// ─────────────────────────────────────────────

exports.getPublicProfile = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const profile = await profileService.getPublicProfile(userId);
    sendResponse(res, 200, 'Public profile fetched', { profile });
});

// ─────────────────────────────────────────────
// Follow / Unfollow Toggle
// ─────────────────────────────────────────────

exports.toggleFollow = catchAsync(async (req, res, next) => {
    const { targetUserId } = req.body;
    if (!targetUserId) {
        return next(new AppError('targetUserId is required', 400));
    }
    if (targetUserId === req.user.id.toString()) {
        return next(new AppError('You cannot follow yourself', 400));
    }
    const result = await profileService.toggleFollowUser(req.user.id, targetUserId);
    sendResponse(res, 200, result.isFollowing ? 'Followed successfully' : 'Unfollowed successfully', result);
});

// ─────────────────────────────────────────────
// Follow Status Check
// ─────────────────────────────────────────────

exports.checkIsFollowing = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const result = await profileService.checkIsFollowing(req.user.id, userId);
    sendResponse(res, 200, 'Follow status fetched', result);
});

// ─────────────────────────────────────────────
// Followers & Following Lists
// ─────────────────────────────────────────────

exports.getFollowers = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const result = await profileService.getFollowers(userId, page, limit);
    sendResponse(res, 200, 'Followers fetched', result);
});

exports.getFollowing = catchAsync(async (req, res, next) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const result = await profileService.getFollowing(userId, page, limit);
    sendResponse(res, 200, 'Following fetched', result);
});
