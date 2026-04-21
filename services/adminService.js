const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AppError = require('../utils/appError');

exports.getAnalytics = async () => {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    // Total sales logic based on completed orders
    const completedOrders = await Order.find({ paymentStatus: 'completed' });
    const totalSales = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0);

    // Dynamic 7-Day Chart Aggregation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const salesAggregation = await Order.aggregate([
        {
            $match: {
                paymentStatus: 'completed',
                createdAt: { $gte: sevenDaysAgo }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                dailySales: { $sum: "$totalPrice" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Ensure we send back a structured array of labels (Dates) and data (Sales)
    const labels = [];
    const data = [];
    
    // Create zero-filled arrays for exactly the last 7 days
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        
        labels.push(dateString.substring(5)); // Add e.g. '03-29' as label
        
        const found = salesAggregation.find(s => s._id === dateString);
        data.push(found ? found.dailySales : 0);
    }

    return { 
        totalUsers, 
        totalProducts, 
        totalOrders, 
        totalSales,
        salesGraphData: { labels, data }
    };
};

exports.getPendingVerifications = async () => {
    return await User.find({ verificationStatus: 'pending' });
};

exports.approveUserVerification = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    
    user.verificationStatus = 'verified';
    await user.save();
    return user;
};

exports.rejectUserVerification = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    
    user.verificationStatus = 'rejected';
    await user.save();
    return user;
};

exports.getAllUsers = async () => {
    return await User.find();
};

exports.getAllOrders = async () => {
    return await Order.find().populate('buyer seller product');
};
