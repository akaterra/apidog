/**
 * @apiPermission permission
 */

const utils = require('../utils');

function parse(block, text, line, index, lines, definitions) {
  if (!text) {
    throw new Error('@apiPermission malformed');
  }

  if (!block.permission) {
    block.permission = [];
  }

  block.permission.push({
    description: definitions[text] ? definitions[text].description : [],
    name: text,
    title: definitions[text] ? definitions[text].title : null,
  });

  return block;
}

module.exports = {
  parse: parse,
};
