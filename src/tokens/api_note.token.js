/**
 * @apiNote name
 */

const utils = require('../utils');

function parse(block, text, line, index, lines, definitions) {
  if (!text) {
    throw new Error('@apiNote malformed');
  }

  block.description = definitions[text] ? definitions[text].description : [];
  block.name = text;
  block.note = block.title = definitions[text] ? definitions[text].title : text;

  return block;
}

module.exports = {
  parse: parse,
};
