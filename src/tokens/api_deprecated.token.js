/**
 * @apiDeprecated [explanation]
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text) {
  block.deprecated = text || true;

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
