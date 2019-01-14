/**
 * @apiOption key [value]
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

const regex = /^(\S+)(\s+(.+))?/;

function parse(block, text) {
  const tokens = regex.exec(text);

  if (! tokens) {
    throw new Error('@apiOption malformed');
  }

  if (! block.option) {
    block.option = {};
  }

  block.option[tokens[1]] = tokens[3] || true;

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
