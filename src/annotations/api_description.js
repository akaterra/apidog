/**
 * @apiDescription [{type}] 1st line
 * 2nd line
 * 3rd line
 * ...
 * nth line
 */

const markdown = require( "markdown" ).markdown;
const utils = require('../utils');

function addDescription(block, text) {
  block.description.push(text);

  return block;
}

const regex = /^(\{(\S+)}\s)?(.+)/;

let lastDescriptionType;

function parse(block, text) {
  if (!text) {
    throw new Error('@apiDescription malformed');
  }

  const tokens = regex.exec(text);

  if (!tokens) {
    throw new Error('@apiDescription malformed');
  }

  const [, , type, line] = tokens;

  lastDescriptionType = type;

  block.description = [line];

  if (!block.validate) {
    block.validate = [validate];
  } else {
    block.validate.push(validate);
  }

  return block;
}

function validate(block, config) {
  switch (lastDescriptionType) {
    case 'markdown':
    case 'md':
      block.description = [markdown.toHTML(block.description.join('\n'))];
  }

  return block;
}

module.exports = {
  addDescription,
  parse,
  validate,
};
