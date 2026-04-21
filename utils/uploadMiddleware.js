/**
 * Upload Middleware — Cloudinary via multer-storage-cloudinary
 * ─────────────────────────────────────────────────────────────
 * Provides three named multer middlewares:
 *
 *   uploadProductImages  — up to 5 images, stored in farmer_connect/products/
 *   uploadProfileImage   — 1 image,   stored in farmer_connect/profiles/
 *   uploadDocument       — 1 image,   stored in farmer_connect/documents/  (govt ID proof)
 *
 * Each route attaches the correct middleware:
 *   POST /api/products           → uploadProductImages  → req.files[]
 *   PATCH /api/profile/update-me → uploadProfileImage   → req.file
 *   POST  /api/profile/verify    → uploadDocument       → req.file
 *
 * In all cases, Cloudinary returns the public HTTPS URL in `req.file.path`
 * (or `req.files[n].path`) — controllers read it from there directly.
 *
 * Transformation defaults:
 *   Products  — max 1200×1200, quality auto (Cloudinary chooses best format)
 *   Profiles  — max 400×400,  face-crop
 *   Documents — max 2000px wide, no crop (preserve legibility)
 */

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const AppError = require('./appError');

// ── Shared mime filter: images only ──────────────────────────
const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new AppError('Only image files (jpg, png, jpeg, webp) are allowed.', 400), false);
    }
};

// ── Size limits ───────────────────────────────────────────────
const LIMITS = {
    products:  { fileSize: 5 * 1024 * 1024 },  // 5 MB per file
    profile:   { fileSize: 3 * 1024 * 1024 },  // 3 MB
    documents: { fileSize: 8 * 1024 * 1024 },  // 8 MB (ID proof scans can be larger)
};

// ─────────────────────────────────────────────────────────────
// 1. Product Images Storage
//    Folder : farmer_connect/products
//    Up to 5 files per listing
// ─────────────────────────────────────────────────────────────
const productStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder:            'farmer_connect/products',
        allowed_formats:   ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
        // Unique public_id: seller-id + timestamp + random
        public_id: `product_${req.user?.id || 'anon'}_${Date.now()}`,
    }),
});

// ─────────────────────────────────────────────────────────────
// 2. Profile Image Storage
//    Folder : farmer_connect/profiles
//    Single file — face detection crop
// ─────────────────────────────────────────────────────────────
const profileStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder:          'farmer_connect/profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
        ],
        public_id: `profile_${req.user?.id || 'anon'}_${Date.now()}`,
    }),
});

// ─────────────────────────────────────────────────────────────
// 3. Government ID / Document Storage
//    Folder : farmer_connect/documents
//    Single file — no aggressive cropping (preserve legibility)
// ─────────────────────────────────────────────────────────────
const documentStorage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder:          'farmer_connect/documents',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
        transformation: [
            { width: 2000, crop: 'limit' },
            { quality: 'auto' },
        ],
        public_id: `doc_${req.user?.id || 'anon'}_${Date.now()}`,
    }),
});

// ── Export multer instances ───────────────────────────────────
exports.uploadProductImages = multer({
    storage:    productStorage,
    fileFilter: imageFilter,
    limits:     LIMITS.products,
}).array('images', 5);

exports.uploadProfileImage = multer({
    storage:    profileStorage,
    fileFilter: imageFilter,
    limits:     LIMITS.profile,
}).single('profileImage');

exports.uploadDocument = multer({
    storage:    documentStorage,
    // Documents can be PDF too — allow broader mime types
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new AppError('Only images (jpg, png, webp) or PDF are accepted for documents.', 400), false);
        }
    },
    limits: LIMITS.documents,
}).single('document');
