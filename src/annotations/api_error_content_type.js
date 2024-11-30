/**
 * @apiContentType contentType
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiErrorContentType malformed');
  }

  if (!block.errorContentType) {
    block.errorContentType = [];
  }

  block.errorContentType = Array.from(new Set(block.errorContentType.concat(utils.strSplitByComma(text))));
  block.addToApidocString(toApidocString);

  return block;
}

function toApidocString(block) {
  if (block.errorContentType !== undefined) {
    return block.errorContentType.map((contentType) => `@apiErrorContentType ${contentType}`);
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
