/**
 * @apiKind 0.0.1
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiKind malformed');
  }

  block.kind = text;

  return block;
}

module.exports = {
  parse: parse,
};
