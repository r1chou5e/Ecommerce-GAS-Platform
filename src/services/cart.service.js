const { cart } = require('../models/cart.model');
const { findProductById } = require('../models/repositories/product.repo');
const { NotFoundError } = require('../core/error.response');

class CartService {
  // Create cart
  static async createUserCart({ userId, product }) {
    const query = { cart_user_id: userId, cart_state: 'active' },
      updateOrInsert = {
        $addToSet: {
          cart_products: product,
        },
      },
      options = {
        upsert: true,
        new: true,
      };

    return await cart.findOneAndUpdate(query, updateOrInsert, options);
  }

  // Update product quantity in cart
  static async updateCartProductQuantity({ userId, product }) {
    const { productId, quantity } = product;
    const query = {
        cart_user_id: userId,
        'cart_products.productId': productId,
        cart_state: 'active',
      },
      updateSet = {
        $inc: {
          'cart_products.$.quantity': quantity,
        },
      },
      options = {
        upsert: true,
        new: true,
      };

    return await cart.findOneAndUpdate(query, updateSet, options);
  }

  // Add product to cart
  static async addProductToCart({ userId, product = {} }) {
    // Check cart exists
    const userCart = await cart.findOne({
      cart_user_id: userId,
    });

    // Cart not exists --> Create cart for user
    if (!userCart) {
      return await this.createUserCart({ userId, product });
    }

    // Cart exists but no products inside --> Add product into cart_products array
    if (userCart.cart_products.length === 0) {
      userCart.cart_products = [product];
      return await userCart.save();
    }

    // Product exists in cart --> Update quantity
    return await this.updateCartProductQuantity({ userId, product });
  }

  // Update cart
  static async addProductToCartV2({ userId, shop_order_ids = {} }) {
    const { productId, quantity, old_quantity } =
      shop_order_ids[0]?.item_products[0];

    // Check product exists
    const foundProduct = await findProductById(productId);
    if (!foundProduct) throw new NotFoundError('Product not exists');

    // Check product belong to shop
    if (foundProduct.product_shop.toString() !== shop_order_ids[0]?.shopId)
      throw new NotFoundError('Product not belong to shop');

    if (quantity === 0) {
      // Delete product from cart
    }

    return await this.updateCartProductQuantity({
      userId,
      product: {
        productId,
        quantity: quantity - old_quantity,
      },
    });
  }

  // Get cart
  // Delete all items from cart
  static async deleteProductFromCart({ userId, productId }) {
    const query = {
        cart_user_id: userId,
        cart_state: 'active',
      },
      updateSet = {
        $pull: {
          cart_products: {
            productId,
          },
        },
      };

    const deletedCart = await cart.updateOne(query, updateSet);

    return deletedCart;
  }

  static async getUserCart({ userId }) {
    return await cart
      .findOne({
        cart_user_id: +userId,
      })
      .lean();
  }
}

module.exports = CartService;
