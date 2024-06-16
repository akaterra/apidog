/**
 * @apiDefine name [title]
 * [description]
 */

const utils = require('../utils');
const peggy = require('./peg/api_define');

function addDescription(block, text) {
  block.define.description.push(text);

  return block;
}

function parse(block, text, line, index, lines, definitions) {
  if (!text) {
    throw new Error('@apiDefine malformed');
  }

  const parsed = peggy.parse(text.trim());

  const blockDefine = block.define = {};

  blockDefine.description = [];
  blockDefine.embeddedLines = lines.filter((line) => line.trim().slice(0, 10) !== '@apiDefine');
  blockDefine.name = parsed.name;
  blockDefine.title = parsed.title;

  definitions[parsed.name] = blockDefine;
  block.addToApidocString(toApidocString);

  return block;
}

function toApidocString(block) {
  if (block.define !== undefined) {
    const args = [
      block.define.name,
    ];

    if (block.define.title) {
      args.push(block.define.title);
    }

    return [`@apiDefine ${args.join(' ')}`, ...block.define.embeddedLines];
  }
}

module.exports = {
  addDescription,
  parse,
  toApidocString,
};
