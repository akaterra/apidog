/**
 * @apiVersion version
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiVersion malformed');
  }

  block.version = text;

  return block;
}

module.exports = {
  parse: parse,
};
