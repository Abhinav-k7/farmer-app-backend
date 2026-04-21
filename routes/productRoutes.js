const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../middleware/authMiddleware');
const { uploadProductImages } = require('../utils/uploadMiddleware');

const router = express.Router();

router.route('/')
    .get(productController.getAllProducts)
    .post(authController.protect, uploadProductImages, productController.createProduct);

router.route('/:id')
    .get(productController.getProduct)
    .patch(authController.protect, productController.updateProduct)
    .delete(authController.protect, productController.deleteProduct);

module.exports = router;
