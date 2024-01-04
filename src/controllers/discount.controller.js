const { SuccessResponse } = require('../core/success.response');
const DiscountService = require('../services/discount.service');

class DiscountController {
  createDiscountCode = async (req, res, next) => {
    new SuccessResponse({
      message: 'Success create discount code',
      metadata: await DiscountService.createDiscountCode({
        ...req.body,
        shop_id: req.user.userId,
      }),
    }).send(res);
  };

  getAllDiscountCodes = async (req, res, next) => {
    new SuccessResponse({
      message: 'Success get all discount codes',
      metadata: await DiscountService.getAllDiscountCodeByShop({
        ...req.body,
        shopId: req.user.userId,
      }),
    }).send(res);
  };

  getDiscountAmount = async (req, res, next) => {
    new SuccessResponse({
      message: 'Success get discount amount',
      metadata: await DiscountService.getDiscountAmount({
        ...req.body,
      }),
    }).send(res);
  };

  getAllProductsByDiscountCode = async (req, res, next) => {
    new SuccessResponse({
      message: 'Success get all products by discount code',
      metadata: await DiscountService.getAllProductsByDiscountCode({
        ...req.query,
      }),
    }).send(res);
  };
}

module.exports = new DiscountController();
