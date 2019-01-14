/**
 * @apiChapter 0.0.1
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text) {
  if (! text) {
    throw new Error('@apiChapter malformed');
  }

  block.chapter = text;

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
