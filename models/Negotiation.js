const mongoose = require('mongoose');

const negotiationSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Negotiation must be tied to a product']
    },
    buyer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Negotiation must be initiated by a buyer']
    },
    seller: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Negotiation must involve a seller']
    },
    proposedPrice: {
        type: Number,
        required: [true, 'Must provide a proposed price']
    },
    quantity: {
        type: Number,
        required: [true, 'Must provide the quantity requested']
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'counter_offer', 'completed'],
        default: 'pending'
    },
    // Tracks who made the most recent offer/counter-offer.
    // The OTHER party (not lastOfferBy) is the one who should see "Accept Offer".
    lastOfferBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    messages: [
        {
            sender: { type: mongoose.Schema.ObjectId, ref: 'User' },
            message: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Negotiation', negotiationSchema);
