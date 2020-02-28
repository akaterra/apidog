/**
 * @apiParamPrefix prefix
 */

const utils = require('../utils');

function parse(block, text) {
  if (!block.paramPrefixStack) {
    block.paramPrefixStack = [];
  }

  if (!text) {
    block.paramPrefix = undefined;
    block.paramPrefixStack = [];
  } else {
    if (text === '..') {
      if (block.paramPrefixStack.length) {
        block.paramPrefix = block.paramPrefixStack.pop();
      } else {
        block.paramPrefix = undefined;
      }
    } else {
      if (block.paramPrefix) {
        block.paramPrefixStack.push(block.paramPrefix);
      }

      block.paramPrefix = block.paramPrefix ? block.paramPrefix + text : text;
    }
  }

  return block;
}

module.exports = {
  parse: parse,
};
