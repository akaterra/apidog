/**
 * @apiDescription [{type}] 1st line
 * 2nd line
 * 3rd line
 * ...
 * nth line
 */

const markdown = require( "markdown" ).markdown;
const utils = require('../utils');
const peggy = require('./peg/api_description');

function addDescription(block, text) {
  if (!text.trim() && !block.description.length) {
    return block;
  }

  block.description.push(text);

  return block;
}

let lastDescriptionType;

function parse(block, text) {
  if (!text) {
    throw new Error('@apiDescription malformed');
  }

  const parsed = peggy.parse(text.trim());

  lastDescriptionType = parsed.type?.name;

  block.description = [parsed.description];

  if (!block.validate) {
    block.validate = [validate];
  } else {
    block.validate.push(validate);
  }

  block.addToApidocString(toApidocString);

  return block;
}

function toApidocString(block) {
  if (block.description !== undefined) {
    return `@apiDescription ${block.description[0]}${block.description.slice(1).map((line) => '\n' + line)}`;
  }

  return null;
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
  toApidocString,
  validate,
};
