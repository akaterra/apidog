/**
 * @apiIgnore
 */

const utils = require('../utils');

function parse(block, text) {
  block.ignore = text || true;

  return block;
}

module.exports = {
  parse: parse,
};
