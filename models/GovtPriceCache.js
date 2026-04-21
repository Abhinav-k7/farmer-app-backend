const mongoose = require('mongoose');

/**
 * GovtPriceCache — stores government MSP / mandi reference prices.
 * Used by priceService as the primary fallback when no live API is available.
 * Compound unique index on (crop, state) prevents duplicates and enables fast lookups.
 */
const govtPriceCacheSchema = new mongoose.Schema({
    crop: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        default: 'national'
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative']
    },
    unit: {
        type: String,
        default: 'kg'
    },
    // 'api' = live fetched, 'seeded' = bundled defaults, 'manual' = admin-entered
    source: {
        type: String,
        enum: ['api', 'seeded', 'manual'],
        default: 'seeded'
    },
    season: {
        type: String,
        default: '2024-25'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false,
    collection: 'govt_prices_cache'
});

// Compound unique index — fast lookup + no duplicates per crop/state pair
govtPriceCacheSchema.index({ crop: 1, state: 1 }, { unique: true });

module.exports = mongoose.model('GovtPriceCache', govtPriceCacheSchema);
