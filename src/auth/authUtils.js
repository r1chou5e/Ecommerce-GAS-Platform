const JWT = require('jsonwebtoken');
const asyncHandler = require('../helpers/asyncHandler');
const { AuthFailureError, NotFoundError } = require('../core/error.response');
const { findByUserId } = require('../services/keyToken.service');

const HEADER = {
  API_KEY: 'x-api-key',
  CLIENT_ID: 'x-client-id',
  AUTHORIZATION: 'authorization',
};

const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    // Access token
    const accessToken = await JWT.sign(payload, publicKey, {
      expiresIn: '2 days',
    });

    // Refresh token
    const refreshToken = await JWT.sign(payload, privateKey, {
      expiresIn: '7 days',
    });

    // Verify
    JWT.verify(accessToken, publicKey, (err, decode) => {
      if (err) {
        console.error(`Verify error::`, err);
      } else {
        console.log(`Verify decode::`, decode);
      }
    });

    return { accessToken, refreshToken };
  } catch (error) {}
};

const authentication = asyncHandler(async (req, res, next) => {
  // Check userId missing
  const userId = req.headers[HEADER.CLIENT_ID];
  if (!userId) throw new AuthFailureError('Invalid Request!');

  // Get accessToken
  const keyStore = await findByUserId(userId);
  if (!keyStore) throw new NotFoundError('Not Found KeyStore!');

  // Verify token
  const accessToken = req.headers[HEADER.AUTHORIZATION];
  if (!accessToken) throw new AuthFailureError('Invalid Request!');
  try {
    const decodeUser = JWT.verify(accessToken, keyStore.publicKey);
    if (userId !== decodeUser.userId)
      throw new AuthFailureError('Invalid UserId');
    req.keyStore = keyStore;
    return next();
  } catch (error) {
    throw error;
  }
});

const verifyJWT = async (token, keySecret) => {
  return await JWT.verify(token, keySecret);
};

module.exports = {
  createTokenPair,
  authentication,
  verifyJWT,
};
