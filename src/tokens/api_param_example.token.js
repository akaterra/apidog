/**
 * @apiParamExample [{type}] [title]
 * [description]
 */

const utils = require('../utils');

function construct(name, fullName) {
  const tokenName = name ? `${name}Example` : 'example';

  function addDescription(block, text) {
    block[tokenName][block[tokenName].length - 1].description.push(text);

    return block;
  }

  const regex = /^({(.+)})?(.+)?/;

  function parse(block, text, line, index, lines, embeddedLines) {
    const tokens = regex.exec(text);

    if (! tokens) {
      throw new Error(`${fullName} malformed`);
    }

    if (! block[tokenName]) {
      block[tokenName] = [];
    }

    const blockParamExample = {};

    block[tokenName].push(blockParamExample);

    blockParamExample.description = [];
    blockParamExample.type = tokens[2] || 'form';
    blockParamExample.title = tokens[3] ? tokens[3].trim() : null;

    return block;
  }

  return {
    addDescription,
    parse,
  };
}

const paramExample = construct('param', '@apiParamExample');

module.exports = {
  addDescription: paramExample.addDescription,
  construct,
  parse: paramExample.parse,
};
