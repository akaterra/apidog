/**
 * @apiVersion version
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiVersion malformed');
  }

  block.version = text;

  return block;
}

function toApidocString(block) {
  if (block.version !== undefined) {
    return `@apiVersion ${block.version}`;
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
