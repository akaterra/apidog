/**
 * @apiGroup group
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text, line, index, lines, embeddedLines) {
  if (! text) {
    throw new Error('@apiGroup malformed');
  }

  block.group = {
    description: embeddedLines[text] ? embeddedLines[text].description : [],
    name: text,
    title: embeddedLines[text] ? embeddedLines[text] .title : null,
  };

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
