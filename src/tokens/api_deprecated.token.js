/**
 * @apiDeprecated [explanation]
 */

const utils = require('../utils');

function parse(block, text) {
  block.deprecated = text || true;

  return block;
}

module.exports = {
  parse: parse,
};
