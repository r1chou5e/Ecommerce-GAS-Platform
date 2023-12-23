const { CREATED, SuccessResponse } = require('../core/success.response');
const AccessService = require('../services/access.service');

class AccessController {
  handleRefreshToken = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get Token Success!',
      metadata: await AccessService.handleRefreshToken(req.body.refreshToken),
    }).send(res);
  };

  logIn = async (req, res, next) => {
    new SuccessResponse({
      message: 'Login Success!',
      metadata: await AccessService.logIn(req.body),
    }).send(res);
  };

  logOut = async (req, res, next) => {
    new SuccessResponse({
      message: 'Logout Success!',
      metadata: await AccessService.logOut({ keyStore: req.keyStore }),
    }).send(res);
  };

  signUp = async (req, res, next) => {
    new CREATED({
      message: 'Register OK!',
      metadata: await AccessService.signUp(req.body),
      options: {
        limit: 10,
      },
    }).send(res);
  };
}

module.exports = new AccessController();
