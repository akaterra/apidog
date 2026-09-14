/**
 * @apiUse [(group)] definition
 */

const utils = require('../utils');
const peggy = require('./peg/api_use');

function parse(block, text, line, index, lines, definitions, config, onlyDefinitions) {
  if (onlyDefinitions) {
    return block;
  }

  const parsed = peggy.parse(text.trim());

  if (!definitions[parsed.definition]) {
    throw new Error(`@apiUse refers to unknown @apiDefine "${parsed.definition}" - check name, block @apiPrivate or CLI "-p" option`);
  }

  lines.splice(index, 1, '', ...definitions[parsed.definition].embeddedLines);

  return block;
}

module.exports = {
  parse: parse,
};
