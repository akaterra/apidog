/**
 * @apiContentType contentType
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text) {
  if (! text) {
    throw new Error('@apiContentType malformed');
  }

  if (! block.contentType) {
    block.contentType = [];
  }

  block.contentType.push(text);

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
