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

function toApidocString(block) {
  if (block.permission !== undefined) {
    return block.permission.map((permission) => `@apiPermission${permission.name}`);
  }

  return null;
}

module.exports = {
  parse,
  toApidocString,
};
