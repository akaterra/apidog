/**
 * @apiSampleRequestProxy http://proxy
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text) {
  if (! text) {
    throw new Error('@apiSampleRequestProxy malformed');
  }

  block.proxy = text;

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
