/**
 * @apiUse name
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

function parse(block, text, line, index, lines, definitions) {
  if (! definitions[text]) {
    throw new Error(`@apiUse refers to unknown @apiDefine: ${text}`);
  }

  lines.splice(index, 1, ...[''].concat(definitions[text].embeddedLines));

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
