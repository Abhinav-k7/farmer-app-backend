const express = require('express');
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProfileImage, uploadDocument } = require('../utils/uploadMiddleware');

const router = express.Router();

// All routes protected with JWT
router.use(protect);

// ── Own Profile ──────────────────────────────
router.get('/me', profileController.getMe);
router.patch('/update-me', uploadProfileImage, profileController.updateMe);
router.post('/verify', uploadDocument, profileController.submitVerification);

// ── Follow / Unfollow ────────────────────────
router.post('/follow', profileController.toggleFollow);

// ── Follow Status & Lists ────────────────────
router.get('/is-following/:userId', profileController.checkIsFollowing);
router.get('/followers/:userId', profileController.getFollowers);
router.get('/following/:userId', profileController.getFollowing);

// ── Public Profile (any user) ─────────────────
router.get('/user/:userId', profileController.getPublicProfile);

module.exports = router;
