const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendResponse = require('../utils/apiResponse');
const priceService = require('../services/priceService');

/**
 * GET /api/prices/compare?crop=Tomato&state=Haryana&farmerPrice=50
 * Public endpoint — no auth required.
 * Returns govt price, farmer price (if provided), and comparison metadata.
 */
exports.comparePrices = catchAsync(async (req, res, next) => {
    const { crop, state, farmerPrice } = req.query;

    if (!crop) {
        return next(new AppError('Please provide a crop name as query param: ?crop=Tomato', 400));
    }

    // Fetch govt price from service (API → cache → null)
    const govtPriceData = await priceService.getGovtPrice(crop, state || null);

    if (!govtPriceData) {
        return sendResponse(res, 200, 'Government price not available for this crop', {
            crop,
            state: state || null,
            govtPrice: null,
            priceSource: 'unavailable',
            comparison: null
        });
    }

    // Compute comparison badge if farmer price provided
    let comparison = null;
    if (farmerPrice && !isNaN(Number(farmerPrice))) {
        comparison = priceService.getPriceComparison(Number(farmerPrice), govtPriceData.price);
    }

    sendResponse(res, 200, 'Government price fetched successfully', {
        crop,
        state: state || 'national',
        govtPrice: govtPriceData.price,
        unit: govtPriceData.unit || 'kg',
        priceSource: govtPriceData.source,
        farmerPrice: farmerPrice ? Number(farmerPrice) : null,
        comparison
    });
});

/**
 * GET /api/prices/cache
 * Admin — returns all cached govt prices for visibility/debugging.
 */
exports.getCachedPrices = catchAsync(async (req, res) => {
    const prices = await priceService.getAllCachedPrices();
    sendResponse(res, 200, `${prices.length} cached govt prices`, { prices });
});

/**
 * POST /api/prices/refresh
 * Admin — forces a live API re-fetch for a specific crop/state.
 * Body: { crop: "Tomato", state: "Haryana" }
 */
exports.refreshCache = catchAsync(async (req, res, next) => {
    const { crop, state } = req.body;

    if (!crop) {
        return next(new AppError('Provide a crop name in request body', 400));
    }

    const result = await priceService.refreshGovtPrice(crop, state || null);

    if (!result) {
        return sendResponse(res, 200, 'Could not fetch from live API. Cache entry removed — will re-seed on next lookup.', {
            crop,
            state: state || 'national',
            refreshed: false
        });
    }

    sendResponse(res, 200, 'Cache refreshed successfully from live API', {
        crop,
        state: state || 'national',
        newPrice: result.price,
        unit: result.unit,
        refreshed: true
    });
});
