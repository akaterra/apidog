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

  block.contentType = Array.from(new Set(block.contentType.concat(utils.strSplitByComma(text))));
  block.addToApidocString((block) => toApidocString(block, text));

  return block;
}

function toApidocString(block, contentType) {
  if (contentType !== undefined) {
    return `@apiContentType ${contentType}`;
  }

  if (block.contentType !== undefined) {
    return block.contentType.map((contentType) => `@apiContentType ${contentType}`);
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
