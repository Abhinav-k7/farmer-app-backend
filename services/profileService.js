const User = require('../models/User');
const AppError = require('../utils/appError');

// ─────────────────────────────────────────────
// Own Profile
// ─────────────────────────────────────────────

exports.getProfile = async (userId) => {
    const user = await User.findById(userId).select('-password -refreshToken');
    if (!user) throw new AppError('User not found', 404);
    return user;
};

exports.updateProfile = async (userId, updateData) => {
    const allowedUpdates = {
        name: updateData.name,
        address: updateData.address,
        profileImage: updateData.profileImage
    };
    Object.keys(allowedUpdates).forEach(key => allowedUpdates[key] === undefined && delete allowedUpdates[key]);
    const updatedUser = await User.findByIdAndUpdate(userId, allowedUpdates, { new: true, runValidators: true }).select('-password -refreshToken');
    return updatedUser;
};

exports.submitVerification = async (userId, aadhaarOrPanUrl) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.verificationStatus === 'verified') throw new AppError('User is already verified', 400);
    user.documents.aadhaarOrPan = aadhaarOrPanUrl;
    user.verificationStatus = 'pending';
    await user.save();
    return user;
};

// ─────────────────────────────────────────────
// Public Profile
// ─────────────────────────────────────────────

exports.getPublicProfile = async (targetUserId) => {
    const user = await User.findById(targetUserId)
        .select('name address profileImage verificationStatus role followers following createdAt');
    if (!user) throw new AppError('User not found', 404);
    return {
        _id: user._id,
        name: user.name,
        address: user.address,
        profileImage: user.profileImage,
        verificationStatus: user.verificationStatus,
        role: user.role,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        memberSince: user.createdAt,
    };
};

// ─────────────────────────────────────────────
// Follow / Unfollow
// ─────────────────────────────────────────────

exports.toggleFollowUser = async (requesterId, targetUserId) => {
    if (requesterId.toString() === targetUserId.toString()) {
        throw new AppError('You cannot follow yourself', 400);
    }

    const [requester, target] = await Promise.all([
        User.findById(requesterId),
        User.findById(targetUserId),
    ]);

    if (!requester || !target) throw new AppError('User not found', 404);

    const alreadyFollowing = requester.following.some(
        id => id.toString() === targetUserId.toString()
    );

    if (alreadyFollowing) {
        // Unfollow
        requester.following.pull(targetUserId);
        target.followers.pull(requesterId);
    } else {
        // Follow
        requester.following.push(targetUserId);
        target.followers.push(requesterId);
    }

    await Promise.all([
        requester.save({ validateBeforeSave: false }),
        target.save({ validateBeforeSave: false }),
    ]);

    return {
        isFollowing: !alreadyFollowing,
        targetFollowersCount: target.followers.length,
        myFollowingCount: requester.following.length,
    };
};

// ─────────────────────────────────────────────
// Check Follow Status
// ─────────────────────────────────────────────

exports.checkIsFollowing = async (requesterId, targetUserId) => {
    const requester = await User.findById(requesterId).select('following');
    if (!requester) throw new AppError('User not found', 404);
    const isFollowing = requester.following.some(
        id => id.toString() === targetUserId.toString()
    );
    return { isFollowing };
};

// ─────────────────────────────────────────────
// Followers & Following Lists (paginated)
// ─────────────────────────────────────────────

exports.getFollowers = async (targetUserId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const user = await User.findById(targetUserId)
        .select('followers')
        .populate({
            path: 'followers',
            select: 'name profileImage verificationStatus address role',
            options: { skip, limit: parseInt(limit) },
        });

    if (!user) throw new AppError('User not found', 404);

    const totalCount = user.followers.length;
    // Re-fetch with pagination correctly — populate does not support skip natively in this pattern
    const fullUser = await User.findById(targetUserId).select('followers');
    const followerIds = fullUser.followers.slice(skip, skip + parseInt(limit));

    const followers = await User.find({ _id: { $in: followerIds } })
        .select('name profileImage verificationStatus address role');

    return {
        followers,
        totalCount,
        page: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
    };
};

exports.getFollowing = async (requesterId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const fullUser = await User.findById(requesterId).select('following');
    if (!fullUser) throw new AppError('User not found', 404);

    const totalCount = fullUser.following.length;
    const followingIds = fullUser.following.slice(skip, skip + parseInt(limit));

    const following = await User.find({ _id: { $in: followingIds } })
        .select('name profileImage verificationStatus address role');

    return {
        following,
        totalCount,
        page: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
    };
};
