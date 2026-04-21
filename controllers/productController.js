const Product = require('../models/Product');
const User = require('../models/User'); // Required to hydrate Mongoose Population registry
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendResponse = require('../utils/apiResponse');
const priceService = require('../services/priceService');

exports.getAllProducts = catchAsync(async (req, res, next) => {
    // 1. Basic Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 2. Advanced Filtering (Price Ranges >= <=)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    let filters = JSON.parse(queryStr);

    // 3. Text-based Search Extension (Name/Location/Category)
    if (req.query.search) {
        filters.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { category: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    let query = Product.find(filters).populate('seller', 'name phone profileImage address');

    // 4. Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    // 5. Execute query and fetch total count for frontend
    const [products, total] = await Promise.all([
        query,
        Product.countDocuments(filters)
    ]);

    sendResponse(res, 200, 'Products fetched successfully', {
        results: products.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        products
    });
});

exports.getProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id).populate('seller', 'name phone profileImage');

    if (!product) {
        return next(new AppError('No product found with that ID', 404));
    }

    sendResponse(res, 200, 'Product details fetched', { product });
});

exports.createProduct = catchAsync(async (req, res, next) => {
    let images = [];
    if (req.files) {
        // Cloudinary returns the full absolute URL natively inside `.path`
        images = req.files.map(file => file.path);
    }

    // Extract region from request body (farmer-provided state, e.g. "Haryana")
    const region = req.body.region || null;

    const newProduct = await Product.create({
        ...req.body,
        images,
        seller: req.user.id,
        region
    });

    // Auto-attach government price (non-blocking — product already saved)
    // Runs silently: if it fails, the product is still created successfully
    (async () => {
        try {
            const govtData = await priceService.getGovtPrice(newProduct.name, region);
            if (govtData) {
                await Product.findByIdAndUpdate(newProduct._id, {
                    governmentPrice: govtData.price,
                    priceSource: govtData.source,
                    priceLastUpdated: new Date()
                });
            }
        } catch (err) {
            // Fail silently — price enrichment is optional
            console.warn('[productController] Govt price enrichment skipped:', err.message);
        }
    })();

    sendResponse(res, 201, 'Product created successfully', { product: newProduct });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) return next(new AppError('No product found with that ID', 404));
    if (product.seller.toString() !== req.user.id && !req.user.isAdmin) {
        return next(new AppError('You can only update your own products', 403));
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    sendResponse(res, 200, 'Product updated successfully', { product: updatedProduct });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) return next(new AppError('No product found with that ID', 404));
    if (product.seller.toString() !== req.user.id && !req.user.isAdmin) {
        return next(new AppError('You can only delete your own products', 403));
    }

    await Product.findByIdAndDelete(req.params.id);

    // 204 No Content
    res.status(204).json({
        status: 'success',
        data: null
    });
});
