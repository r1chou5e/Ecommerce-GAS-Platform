const ProductService = require('../services/product.service');
const ProductServiceV2 = require('../services/product.service.xxx');

const { SuccessResponse } = require('../core/success.response');

class ProductController {
  createProduct = async (req, res, next) => {
    // new SuccessResponse({
    //   message: 'Create new product successfully!',
    //   metadata: await ProductService.createProduct(req.body.product_type, {
    //     ...req.body,
    //     product_shop: req.user.userId,
    //   }),
    // }).send(res);

    new SuccessResponse({
      message: 'Create new product successfully!',
      metadata: await ProductServiceV2.createProduct(req.body.product_type, {
        ...req.body,
        product_shop: req.user.userId,
      }),
    }).send(res);
  };

  updateProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Update product successfully!',
      metadata: await ProductServiceV2.updateProduct(
        req.body.product_type,
        req.params.productId,
        {
          ...req.body,
          product_shop: req.user.userId,
        }
      ),
    }).send(res);
  };

  publishProductByShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get Draft list successfully!',
      metadata: await ProductServiceV2.publishProductByShop({
        product_shop: req.user.userId,
        product_id: req.params.id,
      }),
    }).send(res);
  };

  unpublishProductByShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get Draft list successfully!',
      metadata: await ProductServiceV2.unpublishProductByShop({
        product_shop: req.user.userId,
        product_id: req.params.id,
      }),
    }).send(res);
  };

  /**
   * @desc Get all Drafts for shop
   * @param {Number} limit
   * @param {Number} skip
   * @return {JSON}
   */
  getAllDraftsForShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get Draft list successfully!',
      metadata: await ProductServiceV2.findAllDraftsForShop({
        product_shop: req.user.userId,
      }),
    }).send(res);
  };

  getAllPublishForShop = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get Publish list successfully!',
      metadata: await ProductServiceV2.findAllPublishForShop({
        product_shop: req.user.userId,
      }),
    }).send(res);
  };

  findAllProducts = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get all product list successfully!',
      metadata: await ProductServiceV2.findAllProducts(req.query),
    }).send(res);
  };

  findProduct = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get product detail successfully!',
      metadata: await ProductServiceV2.findProduct({
        product_id: req.params.productId,
      }),
    }).send(res);
  };

  getSearchProductList = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get Search product list successfully!',
      metadata: await ProductServiceV2.searchProducts({
        keysearch: req.params.keysearch,
      }),
    }).send(res);
  };
}

module.exports = new ProductController();
