/**
 * @apiContentType contentType
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiContentType malformed');
  }

  if (!block.contentType) {
    block.contentType = [];
  }

  block.contentType.push(text);

  return block;
}

module.exports = {
  parse: parse,
};
