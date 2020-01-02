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

module.exports = {
  parse: parse,
};
