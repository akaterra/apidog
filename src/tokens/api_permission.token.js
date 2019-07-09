/**
 * @apiPermission permission
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text, line, index, lines, embeddedLines) {
  if (! text) {
    throw new Error('@apiPermission malformed');
  }

  if (! block.permission) {
    block.permission = [];
  }

  block.permission.push({
    description: embeddedLines[text] ? embeddedLines[text].description : [],
    name: text,
    title: embeddedLines[text] ? embeddedLines[text].title : null,
  });

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
