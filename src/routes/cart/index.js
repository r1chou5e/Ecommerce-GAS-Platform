const express = require('express');
const cartController = require('../../controllers/cart.controller');
const asyncHandler = require('../../helpers/asyncHandler');
const { authenticationV2 } = require('../../auth/authUtils');
const router = express.Router();

// router.use(authenticationV2);

router.post('', asyncHandler(cartController.addProductToCart));
router.delete('', asyncHandler(cartController.deleteProductFromCart));
router.post('/update', asyncHandler(cartController.updateProductQuantity));
router.get('', asyncHandler(cartController.getCart));

module.exports = router;
