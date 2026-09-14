/**
 * @apiParseCfg key val
 */

const utils = require('../utils');

function parse(block, text) {
  if (!text) {
    throw new Error('@apiParseCfg malformed');
  }

  if (!block.parseCfg) {
    block.parseCfg = {};
  }

  const [key, val] = text.split(/\s+/);

  if (!key) {
    throw new Error('@apiParseCfg malformed');
  }

  block.parseCfg[key] = val;

  return block;
}

module.exports = {
  parse,
};
