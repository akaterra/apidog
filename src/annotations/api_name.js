/**
 * @apiName name
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiName malformed');
  }

  block.name = text;

  return block;
}

function toApidocString(block) {
  if (block.name !== undefined) {
    return `@apiName ${block.name}`;
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
