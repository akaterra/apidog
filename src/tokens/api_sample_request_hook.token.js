/**
 * @apiSampleRequest hook
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text) {
  if (! text) {
    throw new Error('@apiSampleRequest malformed');
  }

  if (! block.sampleRequestHook) {
    block.sampleRequestHook = [];
  }

  block.sampleRequestHook.push(text);

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
