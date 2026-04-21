const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  
  // Government Verification
  documents: {
    aadhaarOrPan: { type: String, default: '' } // Cloudinary URL
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected", "unverified"],
    default: "unverified"
  },
  
  role: {
    type: String,
    enum: ['farmer', 'buyer', 'admin'],
    default: 'farmer'
  },

  followers: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],

  refreshToken: { type: String }
}, { timestamps: true });

// ── Performance indexes for follow queries ──
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });

module.exports = mongoose.model("User", userSchema);
