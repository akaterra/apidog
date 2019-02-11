/**
 * @apiSampleRequest [off]|[on]|[...]
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

const regex = /^({(.+)}\s+)?(.+)/;

function parse(block, text) {
  const tokens = regex.exec(text);

  if (! tokens) {
    throw new Error('@apiSampleRequest malformed');
  }

  if (! block.sampleRequest) {
    block.sampleRequest = [];
  }

  if (tokens[3] === 'off') {
    block.sampleRequest.push(false);
  } else if (tokens[3] === 'on') {
    block.sampleRequest.push(true);
  } else {
    block.sampleRequest.push(tokens[3]);
  }

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
