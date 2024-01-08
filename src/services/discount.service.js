// Generate discount code [Shop | Admin]
// Get discount amount [User]
// Get all discount codes [User | Shop]
// Verify discount code [User]
// Delete discount code [Shop | Admin]
// Cancel discount code [User]

const { BadRequestError, NotFoundError } = require('../core/error.response');
const { discount } = require('../models/discount.model');
const {
  findAllUnselectedDiscountCodes,
  checkDiscountExists,
} = require('../models/repositories/discount.repo');
const { findAllProducts } = require('../models/repositories/product.repo');
const { convertToObjectIdMongodb } = require('../utils');

class DiscountService {
  static async createDiscountCode(payload) {
    const {
      code,
      start_date,
      end_date,
      active,
      shop_id,
      min_order_value,
      product_ids,
      applies_to,
      name,
      description,
      type,
      value,
      max_value,
      users_used,
      max_uses,
      uses_count,
      max_uses_per_user,
    } = payload;

    // Check date
    if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
      throw new BadRequestError('Discount code is invalid!');
    }

    if (new Date(start_date) >= new Date(end_date)) {
      throw new BadRequestError('Start date must be earlier than end date !');
    }

    // Create index for discount code
    const foundDiscount = await checkDiscountExists({
      model: discount,
      filter: {
        discount_code: code,
        discount_shop_id: convertToObjectIdMongodb(shop_id),
      },
    });

    if (foundDiscount && foundDiscount.discount_active) {
      throw new BadRequestError('Discount exists!');
    }

    const newDiscount = await discount.create({
      discount_name: name,
      discount_description: description,
      discount_type: type,
      discount_code: code,
      discount_value: value,
      discount_min_order_value: min_order_value || 0,
      discount_max_value: max_value,
      discount_start_date: new Date(start_date),
      discount_end_date: new Date(end_date),
      discount_max_uses: max_uses,
      discount_uses_count: uses_count,
      discount_users_used: users_used,
      discount_shop_id: shop_id,
      discount_max_uses_per_user: max_uses_per_user,
      discount_active: active,
      discount_applies_to: applies_to,
      discount_product_ids: applies_to === 'all' ? [] : product_ids,
    });

    return newDiscount;
  }

  static async updateDiscountCode() {}

  static async getAllProductsByDiscountCode({
    code,
    shopId,
    userId,
    limit,
    page,
  }) {
    // Create index for discount_code
    const foundDiscount = await discount
      .findOne({
        discount_code: code,
        discount_shop_id: convertToObjectIdMongodb(shopId),
      })
      .lean();

    if (!foundDiscount || !foundDiscount.discount_active) {
      throw new NotFoundError('Discounts not exist!');
    }

    const { discount_applies_to, discount_product_ids } = foundDiscount;
    let products;

    if (discount_applies_to === 'all') {
      // Get all products
      products = await findAllProducts({
        filter: {
          product_shop: convertToObjectIdMongodb(shopId),
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: 'ctime',
        select: ['product_name'],
      });
    }
    if (discount_applies_to === 'specific') {
      // Get specific products (product_ids)
      products = await findAllProducts({
        filter: {
          _id: { $in: discount_product_ids },
          isPublished: true,
        },
        limit: +limit,
        page: +page,
        sort: 'ctime',
        select: ['product_name'],
      });
    }

    return products;
  }

  static async getAllDiscountCodeByShop({ limit, page, shopId }) {
    const discounts = await findAllUnselectedDiscountCodes({
      limit: +limit,
      page: +page,
      filter: {
        discount_shop_id: convertToObjectIdMongodb(shopId),
        discount_active: true,
      },
      unselect: ['__v', 'discount_shop_id'],
      model: discount,
    });

    return discounts;
  }

  static async getDiscountAmount({ codeId, userId, shopId, products }) {
    const foundDiscount = await checkDiscountExists({
      model: discount,
      filter: {
        discount_code: codeId,
        discount_shop_id: convertToObjectIdMongodb(shopId),
      },
    });

    if (!foundDiscount) throw new NotFoundError('Discount not found');

    const {
      discount_active,
      discount_max_uses,
      discount_start_date,
      discount_end_date,
      discount_min_order_value,
      discount_max_uses_per_user,
      discount_users_used,
      discount_type,
      discount_value,
    } = foundDiscount;

    if (!discount_active) throw new NotFoundError('Discount invalid');
    if (!discount_max_uses) throw new NotFoundError('Discount out of stock');
    if (
      new Date() < new Date(discount_start_date) ||
      new Date() > new Date(discount_end_date)
    )
      throw new NotFoundError('Discount expired');

    let totalOrder = 0;
    if (discount_min_order_value > 0) {
      // Get total
      totalOrder = products.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);

      if (totalOrder < discount_min_order_value)
        throw new NotFoundError(
          `Discount requires a minium order value of ${discount_min_order_value}`
        );
    }

    if (discount_max_uses_per_user > 0) {
      const userUseDiscount = discount_users_used.find(
        (user) => user.userId === userId
      );
      if (userUseDiscount) {
        if (userUseDiscount.length >= discount_max_uses_per_user)
          throw new NotFoundError(
            'User has reached the maximum allowed usage of the discount!'
          );
      }
    }

    // Check fixed or percentage
    const amount =
      discount_type === 'fixed'
        ? discount_value
        : totalOrder * (discount_value / 100);

    return {
      totalOrder,
      discount: amount,
      totalPrice: totalOrder - amount,
    };
  }

  static async getDiscountAmountV2({ discounts, userId, products }) {
    let discountAmount = {
      totalOrder: 0,
      discount: 0,
      totalPrice: 0,
    };
    for (let i = 0; i < discounts.length; i++) {
      const foundDiscount = await checkDiscountExists({
        model: discount,
        filter: {
          discount_code: discounts[i].codeId,
          discount_shop_id: convertToObjectIdMongodb(discounts[i].shopId),
        },
      });

      if (!foundDiscount)
        throw new NotFoundError(`Discount ${discounts[i].codeId} not found`);

      const {
        discount_code,
        discount_active,
        discount_max_uses,
        discount_start_date,
        discount_end_date,
        discount_min_order_value,
        discount_max_uses_per_user,
        discount_users_used,
        discount_type,
        discount_value,
      } = foundDiscount;

      if (!discount_active)
        throw new BadRequestError(`Discount ${discount_code} invalid`);
      if (!discount_max_uses)
        throw new BadRequestError(`Discount ${discount_code} out of stock`);
      if (
        new Date() < new Date(discount_start_date) ||
        new Date() > new Date(discount_end_date)
      )
        throw new BadRequestError(`Discount ${discount_code} expired`);

      // Get total
      discountAmount.totalOrder = products.reduce((acc, product) => {
        return acc + product.quantity * product.price;
      }, 0);

      if (discount_min_order_value > 0) {
        if (discountAmount.totalOrder < discount_min_order_value)
          throw new BadRequestError(
            `Discount ${discount_code} requires a minium order value of ${discount_min_order_value}`
          );
      }

      if (discount_max_uses_per_user > 0) {
        const userUseDiscount = discount_users_used.find(
          (user) => user.userId === userId
        );
        if (userUseDiscount) {
          if (userUseDiscount.length >= discount_max_uses_per_user)
            throw new NotFoundError(
              'User has reached the maximum allowed usage of the discount!'
            );
        }
      }

      // Check fixed or percentage
      const amount =
        discount_type === 'fixed'
          ? discount_value
          : discountAmount.totalOrder * (discount_value / 100);

      discountAmount.discount += amount;
    }

    discountAmount.totalPrice =
      discountAmount.totalOrder - discountAmount.discount;

    return discountAmount;
  }

  static async deleteDiscountCode({ shopId, codeId }) {
    const deleted = await discount.findOneAndDelete({
      discount_code: codeId,
      discount_shop_id: convertToObjectIdMongodb(shopId),
    });

    return deleted;
  }

  static async cancelDiscountCode({ codeId, shopId, userId }) {
    const foundDiscount = await checkDiscountExists({
      model: discount,
      filter: {
        discount_code: codeId,
        discount_shop_id: convertToObjectIdMongodb(shopId),
      },
    });

    if (!foundDiscount) throw new NotFoundError('Discount not found');

    const result = await discount.findByIdAndUpdate(foundDiscount._id, {
      $pull: {
        discount_users_used: userId,
      },
      $in: {
        discount_max_uses: 1,
        discount_uses_count: -1,
      },
    });

    return result;
  }
}

module.exports = DiscountService;
