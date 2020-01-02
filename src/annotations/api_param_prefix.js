/**
 * @apiParamPrefix prefix
 */

const utils = require('../utils');

function parse(block, text) {
  block.paramPrefix = text;

  return block;
}

module.exports = {
  parse: parse,
};
