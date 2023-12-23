const shopModel = require('../models/shop.model');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const KeyTokenService = require('./keyToken.service');
const { createTokenPair, verifyJWT } = require('../auth/authUtils');
const { getInfoData } = require('../utils');
const {
  BadRequestError,
  ConflictRequestError,
  AuthFailureError,
  ForbiddenError,
} = require('../core/error.response');
const { findByEmail } = require('./shop.service');
const { keyBy } = require('lodash');

const RoleShop = {
  SHOP: 'SHOP',
  WRITER: 'WRITER',
  EDIOR: 'EDITOR',
  ADMIN: 'ADMIN',
};

class AccessService {
  static handleRefreshToken = async (refreshToken) => {
    // Check used token
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(
      refreshToken
    );

    if (foundToken) {
      // Decode
      const { userId, email } = await verifyJWT(
        refreshToken,
        foundToken.privateKey
      );
      console.log({ userId, email });
      // Remove
      await KeyTokenService.deleteKeyByUserId(userId);
      throw new ForbiddenError(
        'Expired tokens have been reused! Please re-login'
      );
    }
    const holderToken = await KeyTokenService.findByRefreshToken(refreshToken);

    if (!holderToken) throw new AuthFailureError('Error: Shop not registered!');

    // Verify token
    const { userId, email } = await verifyJWT(
      refreshToken,
      holderToken.privateKey
    );

    // Check userId
    const foundShop = await findByEmail({ email });
    if (!foundShop) throw new AuthFailureError('Error: Shop not registered!');

    // Create new token pair
    const tokens = await createTokenPair(
      { userId: foundShop._id, email },
      holderToken.publicKey,
      holderToken.privateKey
    );

    // Update token
    await KeyTokenService.updateByRefreshToken(
      refreshToken,
      tokens.refreshToken
    );

    return {
      user: { userId, email },
      tokens,
    };
  };

  static logIn = async ({ email, password, refreshToken = null }) => {
    // 1 - Check email in DBs
    const foundShop = await findByEmail({ email });
    if (!foundShop) throw new BadRequestError('Error: Shop not registered!');

    // 2 - Match password
    const match = await bcrypt.compare(password, foundShop.password);
    if (!match) throw new AuthFailureError('Authentication error!');

    // 3 - Create public key, private key
    const privateKey = crypto.randomBytes(64).toString('hex');
    const publicKey = crypto.randomBytes(64).toString('hex');

    // 4 - Generate tokens
    const tokens = await createTokenPair(
      { userId: foundShop._id, email },
      publicKey,
      privateKey
    );

    await KeyTokenService.createKeyToken({
      userId: foundShop._id,
      refreshToken: tokens.refreshToken,
      privateKey,
      publicKey,
    });

    return {
      metadata: {
        shop: getInfoData({
          fields: ['_id', 'name', 'email'],
          object: foundShop,
        }),
        tokens,
      },
    };
  };

  static logOut = async ({ keyStore }) => {
    const delKey = await KeyTokenService.removeKeyById(keyStore._id);
    console.log({ delKey });
    return delKey;
  };

  static signUp = async ({ name, email, password }) => {
    // Check email exists
    const holderShop = await shopModel.findOne({ email }).lean();
    if (holderShop) {
      const error = new BadRequestError('Error: Shop already registered!');
      console.log(error);
      throw error;
    }
    const passwordHash = await bcrypt.hash(password, 10);

    // Create shop account
    const newShop = await shopModel.create({
      name,
      email,
      password: passwordHash,
      roles: [RoleShop.SHOP],
    });

    if (newShop) {
      // Create private key & public key
      // const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      //   modulusLength: 4096,
      //   publicKeyEncoding: {
      //     type: 'pkcs1',
      //     format: 'pem',
      //   },
      //   privateKeyEncoding: {
      //     type: 'pkcs1',
      //     format: 'pem',
      //   },
      // });

      const privateKey = crypto.randomBytes(64).toString('hex');
      const publicKey = crypto.randomBytes(64).toString('hex');

      console.log(privateKey, publicKey); // Save collection KeyStore

      const keyStore = await KeyTokenService.createKeyToken({
        userId: newShop._id,
        publicKey,
        privateKey,
      });

      if (!keyStore)
        return {
          code: 'xxxx',
          message: 'keyStore error',
        };

      // Create token pair
      const tokens = await createTokenPair(
        { userId: newShop._id, email },
        publicKey,
        privateKey
      );
      return {
        code: 201,
        metadata: {
          shop: getInfoData({
            fields: ['_id', 'name', 'email'],
            object: newShop,
          }),
          tokens,
        },
      };
    }
    return {
      code: 200,
      metadata: null,
    };
  };
}

module.exports = AccessService;
