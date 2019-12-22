/**
 * @apiSubgroup name
 */

const utils = require('../utils');

function parse(block, text, line, index, lines, definitions) {
  if (!text) {
    throw new Error('@apiSubgroup malformed');
  }

  block.subgroup = {
    description: definitions[text] ? definitions[text].description : [],
    name: text,
    title: definitions[text] ? definitions[text].title : null,
  };

  return block;
}

module.exports = {
  parse: parse,
};
