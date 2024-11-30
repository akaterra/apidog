/**
 * @apiContentType contentType
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiSuccessContentType malformed');
  }

  if (!block.successContentType) {
    block.successContentType = [];
  }

  block.successContentType = Array.from(new Set(block.successContentType.concat(utils.strSplitByComma(text))));
  block.addToApidocString(toApidocString);

  return block;
}

function toApidocString(block) {
  if (block.successContentType !== undefined) {
    return block.successContentType.map((contentType) => `@apiSuccessContentType ${contentType}`);
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
