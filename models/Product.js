const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Product must belong to a seller (user)']
    },
    name: {
        type: String,
        required: [true, 'A product must have a name'],
        trim: true,
        maxlength: [100, 'A product name must have less or equal than 100 characters']
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'A product must have a category']
    },
    price: {
        type: Number,
        required: [true, 'A product must have a price']
    },
    unit: {
        type: String,
        required: [true, 'Specify product unit (e.g., kg, ton, piece)'],
        default: 'kg'
    },
    quantityAvailable: {
        type: Number,
        required: [true, 'Specify available quantity'],
        min: [0, 'Quantity cannot be negative']
    },
    images: [String],
    isNegotiable: {
        type: Boolean,
        default: true
    },
    ratings: [
        {
            user: { type: mongoose.Schema.ObjectId, ref: 'User' },
            rating: { type: Number, min: 1, max: 5 },
            review: String,
            createdAt: { type: Date, default: Date.now }
        }
    ],
    averageRating: {
        type: Number,
        default: 0
    },
    // ── Government Price Comparison fields (added: Gov Price System) ──
    governmentPrice: {
        type: Number,
        default: null
    },
    // 'api' | 'cache' | 'seeded' | 'manual' | 'unavailable'
    priceSource: {
        type: String,
        default: null
    },
    region: {
        type: String,
        trim: true,
        default: null
    },
    priceLastUpdated: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
        select: false
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

module.exports = mongoose.model('Product', productSchema);
