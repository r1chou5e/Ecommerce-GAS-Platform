const _ = require('lodash');
const { Types } = require('mongoose');

const convertToObjectIdMongodb = (id) => new Types.ObjectId(id);

const getInfoData = ({ fields = [], object = {} }) => {
  return _.pick(object, fields);
};

const getSelectData = (select = []) => {
  return Object.fromEntries(select.map((el) => [el, 1]));
};

const getUnselectData = (unSelect = []) => {
  return Object.fromEntries(unSelect.map((el) => [el, 0]));
};

const removeUndefinedObject = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === null) {
      delete obj[key];
    }
  });
  return obj;
};

const updateNestedObjectParser = (obj) => {
  console.log(`[1]::`, obj);
  const final = {};
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      const response = updateNestedObjectParser(obj[k]);
      Object.keys(response).forEach((responseKey) => {
        final[`${key}.${responseKey}`] = response[responseKey];
      });
    } else {
      final[key] = obj[key];
    }
  });
  console.log(`[2]::`, final);
  return final;
};

module.exports = {
  getInfoData,
  getSelectData,
  getUnselectData,
  removeUndefinedObject,
  updateNestedObjectParser,
  convertToObjectIdMongodb,
};
