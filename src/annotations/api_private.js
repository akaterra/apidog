/**
 * @apiPrivate [slice,..]
 */

const utils = require('../utils');

function parse(block, text) {
  if (!block.private) {
    block.private = [];
  }

  if (text) {
    block.private = block.private.concat(utils.strSplitByComma(text));
  } else {
    block.private = true;
  }

  block.addToApidocString(toApidocString);

  return block;
}

function toApidocString(block) {
  if (block.private !== undefined) {
    return `@apiPrivate${block.private !== true ? ' ' + block.private.map((private) => utils.quote(private)).join(',') : ''}`;
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
