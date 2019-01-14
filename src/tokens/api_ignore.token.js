/**
 * @apiIgnore
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text) {
  block.ignore = text || true;

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
