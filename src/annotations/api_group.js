/**
 * @apiGroup name
 */

const utils = require('../utils');

function parse(block, text, line, index, lines, definitions) {
  if (!text) {
    throw new Error('@apiGroup malformed');
  }

  block.group = {
    description: definitions[text] ? definitions[text].description : [],
    name: text,
    title: definitions[text] ? definitions[text].title : null,
  };

  block.addToApidocString(toApidocString);

  return block;
}

function toApidocString(block) {
  if (block.group !== undefined) {
    return `@apiGroup ${block.group.name}`;
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
