/**
 * @apiSampleRequest [off]|[on]|[...]
 */

const utils = require('../utils');

const regex = /^({(.+)}\s+)?(.+)/;

function parse(block, text) {
  if (!text) {
    throw new Error('@apiSampleRequest malformed');
  }

  const tokens = regex.exec(text);

  if (!tokens) {
    throw new Error('@apiSampleRequest malformed');
  }

  if (!block.sampleRequest) {
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
  parse: parse,
};
