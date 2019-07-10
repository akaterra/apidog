/**
 * @apiChapter 0.0.1
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text, line, index, lines, definitions) {
  if (! text) {
    throw new Error('@apiChapter malformed');
  }

  block.chapter = {
    description: definitions[text] ? definitions[text].description : [],
    name: text,
    title: definitions[text] ? definitions[text].title : null,
  };

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
