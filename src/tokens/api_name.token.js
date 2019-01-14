/**
 * @apiName name
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text) {
  if (! text) {
    throw new Error('@apiName malformed');
  }

  block.name = text;

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
