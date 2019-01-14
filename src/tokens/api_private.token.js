/**
 * @apiPrivate [slice,..]
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text) {
  block.private = text ? utils.strSplitByComma(text) : true;

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
