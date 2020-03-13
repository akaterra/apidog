/**
 * @apiPrivate [slice,..]
 */

const utils = require('../utils');

function parse(block, text) {
  block.private = text ? utils.strSplitByComma(text) : true;

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
