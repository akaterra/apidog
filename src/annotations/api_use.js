/**
 * @apiUse name
 */

const utils = require('../utils');

function parse(block, text, line, index, lines, definitions, config, onlyDefinitions) {
  if (onlyDefinitions) {
    return block;
  }

  if (!text) {
    throw new Error('@apiUse malformed');
  }

  if (!definitions[text]) {
    throw new Error(`@apiUse refers to unknown @apiDefine "${text}" - check name, block @apiPrivate or "-p" CLI option`);
  }

  lines.splice(index, 1, ...[''].concat(definitions[text].embeddedLines));

  return block;
}

module.exports = {
  parse: parse,
};
