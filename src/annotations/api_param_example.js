/**
 * @apiParamExample [{type}] [title]
 * [description]
 */

const utils = require('../utils');

function construct(name, fullName) {
  const annotationName = name ? `${name}Example` : 'example';

  function addDescription(block, text) {
    block[annotationName][block[annotationName].length - 1].description.push(text);

    return block;
  }

  const regex = /^({(.+)})?(.+)?/;

  function parse(block, text, line, index, lines, embeddedLines) {
    const annotations = regex.exec(text);

    if (!annotations) {
      throw new Error(`${fullName} malformed`);
    }

    if (!block[annotationName]) {
      block[annotationName] = [];
    }

    const blockParamExample = {};

    block[annotationName].push(blockParamExample);

    blockParamExample.description = [];
    blockParamExample.type = annotations[2] || 'form';
    blockParamExample.title = annotations[3] ? annotations[3].trim() : null;

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
