/**
 * @apiSampleRequestOption key [value]
 */

const utils = require('../utils');

const regex = /^(\S+)(\s+(.+))?/;

function parse(block, text) {
  const annotations = regex.exec(text);

  if (!annotations) {
    throw new Error('@apiSampleRequestOption malformed');
  }

  if (!block.sampleRequestOption) {
    block.sampleRequestOption = {};
  }

  block.sampleRequestOption[annotations[1]] = annotations[3] || true;

  return block;
}

module.exports = {
  parse: parse,
};
