/**
 * @apiContentType contentType
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiStatusCode malformed');
  }

  if (!block.statusCode) {
    block.statusCode = [];
  }

  block.statusCode = Array.from(new Set(block.statusCode.concat(utils.strSplitByComma(text))));
  block.addToApidocString((block) => toApidocString(block, text));

  return block;
}

function toApidocString(block, statusCode) {
  if (statusCode !== undefined) {
    return `@apiStatusCode ${statusCode}`;
  }

  if (block.statusCode !== undefined) {
    return block.statusCode.map((statusCode) => `@apiStatusCode ${statusCode}`);
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
