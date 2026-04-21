const authRepository = require('../repositories/authRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

exports.registerUser = async (userData) => {
    const existingUser = await authRepository.findUserByPhone(userData.phone);
    if (existingUser) {
        throw new AppError('Phone number already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = await authRepository.createUser({
        name: userData.name,
        phone: userData.phone,
        password: hashedPassword
    });

    const tokens = this.generateTokens(user._id, user.isAdmin);
    await authRepository.updateUser(user._id, { refreshToken: tokens.refreshToken });

    user.password = undefined;
    return { user, tokens };
};

exports.loginUser = async (phone, password) => {
    const user = await authRepository.findUserByPhone(phone);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError('Incorrect phone number or password', 401);
    }

    const tokens = this.generateTokens(user._id, user.isAdmin);
    await authRepository.updateUser(user._id, { refreshToken: tokens.refreshToken });

    user.password = undefined;
    return { user, tokens };
};

exports.generateTokens = (id, isAdmin) => {
    // accessToken: 7d — long enough for development; swap to '15m' + refresh-loop for production
    const accessToken = jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    return { accessToken, refreshToken };
};

exports.refreshAccessToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await authRepository.findUserById(decoded.id);
        
        if (!user || user.refreshToken !== token) {
            throw new AppError('Invalid refresh token', 401);
        }

        const newTokens = this.generateTokens(user._id, user.isAdmin);
        await authRepository.updateUser(user._id, { refreshToken: newTokens.refreshToken });
        
        return newTokens;
    } catch (err) {
        throw new AppError('Invalid or expired refresh token', 401);
    }
};

exports.logout = async (userId) => {
    await authRepository.updateUser(userId, { refreshToken: null });
};
