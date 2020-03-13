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

function toApidocString(block) {
  if (block.contentType !== undefined) {
    return block.contentType.map((contentType) => `@apiContentType ${contentType}`);
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
