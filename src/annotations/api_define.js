/**
 * @apiDefine name [title]
 * [description]
 */

const utils = require('../utils');
const peggy = require('./peg/api_define');

const parseApiPrivate = require('./api_private').parse;

function addDescription(block, text) {
  block.define.description.push(text);

  return block;
}

function parse(block, text, line, index, lines, definitions) {
  if (!text) {
    throw new Error('@apiDefine malformed');
  }

  const parsed = peggy.parse(text.trim());
  const apiPrivate = lines.find((line) => line.trim().split(/\s+/, 2)[0]?.toLowerCase() === '@apiprivate');

  if (apiPrivate) {
    parseApiPrivate(block, apiPrivate.slice(apiPrivate.toLowerCase().indexOf('@apiprivate') + 11), line, index, lines, definitions);
  }

  return [
    block,
    () => {
      const blockDefine = block.define = {};

      blockDefine.description = [];
      blockDefine.embeddedLines = lines.filter((line) => line.trim().split(/\s+/, 2)[0]?.toLowerCase() !== '@apidefine');
      blockDefine.name = parsed.name;
      blockDefine.title = parsed.title;
    
      definitions[parsed.name] = blockDefine;
      block.addToApidocString(toApidocString);
    },
  ];

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
