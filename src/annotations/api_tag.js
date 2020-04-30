/**
 * @apiTag tag
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiTag malformed');
  }

  if (!block.tag) {
    block.tag = [];
  }

  block.tag = block.tag.concat(utils.strSplitByComma(text));

  return block;
}

function toApidocString(block) {
  if (block.tag !== undefined) {
    return block.tag.map((tag) => `@apiTag ${tag}`);
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
