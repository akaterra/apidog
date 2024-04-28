/**
 * @apiSampleRequestProxy http://proxy
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiSampleRequestProxy malformed');
  }

  block.sampleRequestProxy = text;
  block.addToApidocString(toApidocString);

  return block;
}

function toApidocString(block) {
  if (block.sampleRequestProxy !== undefined) {
    return `@apiSampleRequestProxy ${block.sampleRequestProxy}`;
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
