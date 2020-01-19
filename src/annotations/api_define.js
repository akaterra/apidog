/**
 * @apiDefine name [title]
 * [description]
 */

const utils = require('../utils');

function addDescription(block, text) {
  block.define.description.push(text);

  return block;
}

const regex = /^(\S+)(\s+(.+))?/;

function parse(block, text, line, index, lines, definitions) {
  if (!text) {
    throw new Error('@apiDefine malformed');
  }

  const tokens = regex.exec(text);

  if (!tokens) {
    throw new Error('@apiDefine malformed');
  }

  const blockDefine = block.define = {};

  blockDefine.description = [];
  blockDefine.embeddedLines = lines.filter((line) => line.trim().substr(0, 10) !== '@apiDefine');
  blockDefine.name = tokens[1];
  blockDefine.title = tokens[3] || null;

  // if (!block.description) {
  //   block.description = blockDefine.description;
  // }
  //
  // if (!block.title) {
  //   block.title = blockDefine.title;
  // }

  definitions[tokens[1]] = blockDefine;

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
