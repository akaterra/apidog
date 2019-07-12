/**
 * @apiPrivate [slice,..]
 */

const utils = require('../utils');

function parse(block, text) {
  block.private = text ? utils.strSplitByComma(text) : true;

  return block;
}

module.exports = {
  parse: parse,
};
