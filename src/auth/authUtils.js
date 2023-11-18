const JWT = require('jsonwebtoken');

const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    // Access token
    const accessToken = await JWT.sign(payload, publicKey, {
      expiresIn: '2 days',
    });

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

module.exports = {
  createTokenPair,
};
