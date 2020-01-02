/**
 * @apiParamPrefix prefix
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiParamPrefix malformed');
  }

  block.paramPrefix = text;

  return block;
}

module.exports = {
  parse: parse,
};
