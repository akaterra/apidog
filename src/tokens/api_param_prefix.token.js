/**
 * @apiParamPrefix prefix
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text) {
  block.paramPrefix = text;

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
