/**
 * @apiPermission permission
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text) {
  if (! text) {
    throw new Error('@apiPermission malformed');
  }

  if (! block.permission) {
    block.permission = [];
  }

  block.permission.push(text);

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
