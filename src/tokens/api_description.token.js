/**
 * @apiDescription First line
 * Second line
 * Third line
 */

const utils = require('../utils');

function addDescription(block, text) {
  block.description.push(text);

  return block;
}

function parse(block, text) {
  block.description = [text];

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
