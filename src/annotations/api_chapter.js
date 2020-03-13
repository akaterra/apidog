/**
 * @apiChapter name
 */

const utils = require('../utils');

function parse(block, text, line, index, lines, definitions) {
  if (!text) {
    throw new Error('@apiChapter malformed');
  }

  block.chapter = {
    description: definitions[text] ? definitions[text].description : [],
    name: text,
    title: definitions[text] ? definitions[text].title : null,
  };

  return block;
}

function toApidocString(block) {
  if (block.chapter !== undefined) {
    return `@apiChapter ${block.chapter.name}`;
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
