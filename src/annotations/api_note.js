/**
 * @apiNote name
 */

const utils = require('../utils');

function parse(block, text, line, index, lines, definitions) {
  if (!text) {
    throw new Error('@apiNote malformed');
  }

  block.name = block.note = block.title = text;
  block.addValidateAfter(validate).addToApidocString(toApidocString);

  return block;
}

function toApidocString(block) {
  if (block.note !== undefined) {
    return `@apiNote ${block.name}`;
  }

  return null;
}

function validate(block, config) {
  if (!block.version && config.version) {
    block.version = config.version;
  }

  return block;
}

module.exports = {
  parse,
  toApidocString,
  validate,
};
