/**
 * @apiFamily name
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiFamily malformed');
  }

  block.family = text;

  return block;
}

function toApidocString(block) {
  if (block.family !== undefined) {
    return `@apiFamily ${block.family}`;
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
