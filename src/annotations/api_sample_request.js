/**
 * @apiSampleRequest [off]|[on]|[...]
 */

const utils = require('../utils');

const regex = /^({(.+)}\s+)?(.+)/;

function parse(block, text) {
  const annotations = regex.exec(text);

  if (!annotations) {
    throw new Error('@apiSampleRequest malformed');
  }

  if (!block.sampleRequest) {
    block.sampleRequest = [];
  }

  if (annotations[3] === 'off') {
    block.sampleRequest.push(false);
  } else if (annotations[3] === 'on') {
    block.sampleRequest.push(true);
  } else {
    block.sampleRequest.push(annotations[3]);
  }

  return block;
}

module.exports = {
  parse: parse,
};
