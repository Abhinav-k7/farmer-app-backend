const adminService = require('../services/adminService');
const catchAsync = require('../utils/catchAsync');
const sendResponse = require('../utils/apiResponse');

exports.getAnalyticsDashboard = catchAsync(async (req, res, next) => {
    const analytics = await adminService.getAnalytics();
    sendResponse(res, 200, 'Analytics fetched', analytics);
});

exports.getPendingVerifications = catchAsync(async (req, res, next) => {
    const users = await adminService.getPendingVerifications();
    sendResponse(res, 200, 'Pending verifications fetched', { users });
});

exports.approveVerification = catchAsync(async (req, res, next) => {
    const user = await adminService.approveUserVerification(req.params.id);
    sendResponse(res, 200, 'User verification approved', { user });
});

exports.rejectVerification = catchAsync(async (req, res, next) => {
    const user = await adminService.rejectUserVerification(req.params.id);
    sendResponse(res, 200, 'User verification rejected', { user });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await adminService.getAllUsers();
    sendResponse(res, 200, 'Users fetched', { users });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
    const orders = await adminService.getAllOrders();
    sendResponse(res, 200, 'Orders fetched', { orders });
});
