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

function toApidocString(block) {
  if (block.subgroup !== undefined) {
    return `@apiSubgroup ${block.subgroup.name}`;
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
