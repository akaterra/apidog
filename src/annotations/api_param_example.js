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
    if (!text) {
      throw new Error(`${fullName} malformed`);
    }

    const tokens = regex.exec(text);

    if (!tokens) {
      throw new Error(`${fullName} malformed`);
    }

    if (!block[annotationName]) {
      block[annotationName] = [];
    }

    const blockExample = {};

    block[annotationName].push(blockExample);

    blockExample.description = [];
    blockExample.type = tokens[2] || 'form';
    blockExample.title = tokens[3] ? tokens[3].trim() : null;

    return block;
  }

  function toApidocString(block) {
    if (block[annotationName] !== undefined) {
      return block[annotationName].map((example) => {
        const args = [];

        if (example.type) {
          args.push(`{${example.type}}`);
        }

        if (example.title) {
          args.push(example.title);
        }

        return `@apiParamExample ${args.join(' ')}${example.description.map((line) => '\n' + line)}`;
      });
    }
  
    return null;
  }

  return {
    addDescription,
    parse,
    toApidocString,
  };
}

const paramExample = construct('param', '@apiParamExample');

module.exports = {
  addDescription: paramExample.addDescription,
  construct,
  parse: paramExample.parse,
  toApidocString: paramExample.toApidocString,
};
