/**
 * @apiGroup group
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text) {
  if (! text) {
    throw new Error('@apiSubgroup malformed');
  }

  block.subgroup = text;

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
