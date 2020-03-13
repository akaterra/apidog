/**
 * @apiIgnore
 */

const utils = require('../utils');

function parse(block, text) {
  block.ignore = text || true;

  return block;
}

function toApidocString(block) {
  if (block.ignore !== undefined) {
    return `@apiIgnore${block.ignore !== true ? ' ' + block.ignore : ''}`;
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
