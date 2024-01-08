const { NotFoundError, BadRequestError } = require('../core/error.response');
const { findCartById } = require('../models/repositories/cart.repo');
const {
  filteredAvailableProducts,
} = require('../models/repositories/product.repo');
const {
  getDiscountAmount,
  getDiscountAmountV2,
} = require('./discount.service');

class CheckoutService {
  /*
    {
        cartId,
        userId, 
        shop_order_ids: [
            {
                shopId,
                shop_discount: [],
                item_products: [
                    price,
                    quantity,
                    productId,
                ]
            }
             {
                shopId,
                shop_discounts: [
                    {
                        shopId,
                        discountId,
                        codeId
                    }
                ],
                item_products: [
                    price,
                    quantity,
                    productId,
                ]
            }
        ]
    }
 */
  static async checkoutReview({ cartId, userId, shop_order_ids = [] }) {
    const foundCart = await findCartById(cartId);
    if (!foundCart) throw new NotFoundError('Cart not exists!');

    const checkoutOrder = {
        totalPrice: 0,
        feeShip: 0,
        totalDiscount: 0,
        totalCheckout: 0,
      },
      shop_order_ids_new = [];

    // Calculate total bill
    for (let i = 0; i < shop_order_ids.length; i++) {
      const {
        shopId,
        shop_discounts = [],
        item_products = [],
      } = shop_order_ids[i];

      // Check product available
      const filteredProducts = await filteredAvailableProducts(item_products);
      console.log(`filteredAvailableProducts::`, filteredProducts);
      if (!filteredProducts[0]) throw new BadRequestError('Order error !!');

      // Total products price
      const checkoutPrice = filteredProducts.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);

      checkoutOrder.totalPrice += checkoutPrice;
      const itemCheckout = {
        shopId,
        shop_discounts,
        priceBeforeDiscount: checkoutPrice,
        priceAfterDiscount: checkoutPrice,
        item_products: filteredProducts,
      };

      // Check discounts
      if (shop_discounts.length > 0) {
        // If only 1 discount
        // Get amount discount
        const { totalPrice = 0, discount = 0 } = await getDiscountAmountV2({
          discounts: shop_discounts,
          userId,
          products: filteredProducts,
        });

        // Total discounts
        checkoutOrder.totalDiscount += discount;

        if (discount > 0) {
          itemCheckout.priceAfterDiscount = checkoutPrice - discount;
        }
      }

      // Final checkout total
      checkoutOrder.totalCheckout += itemCheckout.priceAfterDiscount;
      shop_order_ids_new.push(itemCheckout);
    }

    return {
      shop_order_ids,
      shop_order_ids_new,
      checkoutOrder,
    };
  }
}

module.exports = CheckoutService;
