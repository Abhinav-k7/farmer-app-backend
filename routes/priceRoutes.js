const express = require('express');
const priceController = require('../controllers/priceController');
const { protect, restrictToAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/prices/compare?crop=Tomato&state=Haryana&farmerPrice=50
 * Public — returns govt price + comparison badge for a crop/state pair
 */
router.get('/compare', priceController.comparePrices);

/**
 * GET /api/prices/cache
 * Admin — view all cached govt prices
 */
router.get('/cache', protect, restrictToAdmin, priceController.getCachedPrices);

/**
 * POST /api/prices/refresh
 * Admin — force-refresh a specific crop's price from the external API
 * Body: { crop: "Tomato", state: "Haryana" }
 */
router.post('/refresh', protect, restrictToAdmin, priceController.refreshCache);

module.exports = router;
