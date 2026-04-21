const User = require('../models/User');

exports.findUserByPhone = async (phone) => {
    return await User.findOne({ phone }).select('+password');
};

exports.createUser = async (userData) => {
    return await User.create(userData);
};

exports.updateUser = async (userId, updateData) => {
    return await User.findByIdAndUpdate(userId, updateData, { new: true });
};

exports.findUserById = async (id) => {
    return await User.findById(id);
};
