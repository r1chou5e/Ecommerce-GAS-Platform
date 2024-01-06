const { SuccessResponse } = require('../core/success.response');
const CartService = require('../services/cart.service');

class CartController {
  addProductToCart = async (req, res, next) => {
    new SuccessResponse({
      message: 'Successful Add Product to Cart!',
      metadata: await CartService.addProductToCart(req.body),
    }).send(res);
  };

  updateProductQuantity = async (req, res, next) => {
    new SuccessResponse({
      message: 'Successful Update Quantity Product !',
      metadata: await CartService.addProductToCartV2(req.body),
    }).send(res);
  };

  deleteProductFromCart = async (req, res, next) => {
    new SuccessResponse({
      message: 'Successful Delete Product From Cart!',
      metadata: await CartService.deleteProductFromCart(req.body),
    }).send(res);
  };

  getCart = async (req, res, next) => {
    new SuccessResponse({
      message: 'Successful Get Cart',
      metadata: await CartService.getUserCart(req.query),
    }).send(res);
  };
}

module.exports = new CartController();
