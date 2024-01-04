const { getUnselectData, getSelectData } = require('../../utils');
const { discount } = require('../discount.model');

const findAllUnselectedDiscountCodes = async ({
  limit = 50,
  page = 1,
  sort = 'ctime',
  filter,
  unselect,
  model,
}) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 };
  const documents = await model
    .find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(getUnselectData(unselect))
    .lean();

  return documents;
};

const findAllSelectedDiscountCodes = async ({
  limit = 50,
  page = 1,
  sort = 'ctime',
  filter,
  select,
  model,
}) => {
  const skip = (page - 1) * limit;
  const sortBy = sort === 'ctime' ? { _id: -1 } : { _id: 1 };
  const documents = await model
    .find(filter)
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .select(getSelectData(select))
    .lean();

  return documents;
};

const checkDiscountExists = async ({ model, filter }) => {
  return await discount.findOne(filter).lean();
};

module.exports = {
  findAllUnselectedDiscountCodes,
  findAllSelectedDiscountCodes,
  checkDiscountExists,
};
