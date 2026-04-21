/**
 * Cloudinary Configuration
 * ─────────────────────────────────────────────
 * Initializes the Cloudinary SDK once at app startup.
 * All upload middleware (multer-storage-cloudinary) imports
 * this configured instance instead of calling cloudinary.config() multiple times.
 *
 * Required .env variables:
 *   CLOUDINARY_CLOUD_NAME  — your cloud name from dashboard.cloudinary.com
 *   CLOUDINARY_API_KEY     — API Key from Cloudinary dashboard
 *   CLOUDINARY_API_SECRET  — API Secret from Cloudinary dashboard
 */

const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,   // Always use HTTPS URLs
});

// Validate that credentials look real at startup to catch misconfiguration early
const isConfigured = () => {
    const { cloud_name, api_key, api_secret } = cloudinary.config();
    return (
        cloud_name && !cloud_name.startsWith('my_') &&
        api_key    && api_key.length > 10 &&
        api_secret && !api_secret.startsWith('my_')
    );
};

if (!isConfigured()) {
    console.warn(
        '⚠️  [Cloudinary] Placeholder credentials detected in .env.\n' +
        '   Image uploads will FAIL until you add real credentials from:\n' +
        '   https://dashboard.cloudinary.com → Settings → API Keys'
    );
}

module.exports = cloudinary;
