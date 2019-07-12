/**
 * @apiUse name
 */

const utils = require('../utils');

function parse(block, text, line, index, lines, definitions) {
  if (!definitions[text]) {
    throw new Error(`@apiUse refers to unknown @apiDefine: ${text}`);
  }

  lines.splice(index, 1, ...[''].concat(definitions[text].embeddedLines));

  return block;
}

module.exports = {
  parse: parse,
};
