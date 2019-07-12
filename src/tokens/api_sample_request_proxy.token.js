/**
 * @apiSampleRequestProxy http://proxy
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiSampleRequestProxy malformed');
  }

  block.sampleRequestProxy = text;

  return block;
}

module.exports = {
  parse: parse,
};
