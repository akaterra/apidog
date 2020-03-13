/**
 * @apiDeprecated [explanation]
 */

const utils = require('../utils');

function parse(block, text) {
  block.deprecated = text || true;

  return block;
}

function toApidocString(block) {
  if (block.deprecated !== undefined) {
    return `@apiDeprecated${block.deprecated !== true ? ' ' + block.deprecated : ''}`;
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
