const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/apiResponse');
const { registerSchema, loginSchema, refreshTokenSchema } = require('../validators/authValidator');
const AppError = require('../utils/appError');

exports.register = catchAsync(async (req, res, next) => {
    const { error } = registerSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));

    const { user, tokens } = await authService.registerUser(req.body);
    sendResponse(res, 201, 'User registered successfully', { user, tokens });
});

exports.login = catchAsync(async (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));

    const { user, tokens } = await authService.loginUser(req.body.phone, req.body.password);
    sendResponse(res, 200, 'Login successful', { user, tokens });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
    const { error } = refreshTokenSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));

    const tokens = await authService.refreshAccessToken(req.body.refreshToken);
    sendResponse(res, 200, 'Token refreshed', { tokens });
});

exports.logout = catchAsync(async (req, res, next) => {
    await authService.logout(req.user.id);
    sendResponse(res, 200, 'Logged out successfully');
});
