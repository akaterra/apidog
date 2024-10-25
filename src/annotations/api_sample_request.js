/**
 * @apiSampleRequest [{type}] [off]|[on]|[...]
 */

const utils = require('../utils');
const peggy = require('./peg/api_sample_request');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiSampleRequest malformed');
  }

  const parsed = peggy.parse(text.trim());

  if (!block.sampleRequest) {
    block.sampleRequest = [];
  }

  if (parsed.url === 'off') {
    block.sampleRequest.push(false);
  } else if (parsed.url === 'on') {
    block.sampleRequest.push(true);
  } else {
    block.sampleRequest.push(parsed.url);
  }

  return block;
}

module.exports = {
  parse: parse,
};
