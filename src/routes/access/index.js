const express = require('express');
const accessController = require('../../controllers/access.controller');
const asyncHandler = require('../../helpers/asyncHandler');
const { authentication } = require('../../auth/authUtils');
const router = express.Router();

// Sign up
router.post('/shop/signup', asyncHandler(accessController.signUp));

// Log in
router.post('/shop/login', asyncHandler(accessController.logIn));

// Authentiaction
router.use(authentication);

// Log out
router.post('/shop/logout', asyncHandler(accessController.logOut));

// Handle refreshToken
router.post(
  '/shop/handle-refresh-token',
  asyncHandler(accessController.handleRefreshToken)
);

module.exports = router;
