/**
 * @apiParamExample [{type}] [title]
 * [description]
 */

const utils = require('../utils');
const peggy = require('./peg/api_param_example');

function construct(name) {
  const annotationName = name ? `${name}Example` : 'example';

  function addDescription(block, text) {
    block[annotationName][block[annotationName].length - 1].description.push(text);

    return block;
  }

  function parse(block, text, line, index, lines, embeddedLines) {
    // if (!text) {
    //   throw new Error(`${fullName} malformed`);
    // }

    const parsed = peggy.parse(text.trim());

    if (!block[annotationName]) {
      block[annotationName] = [];
    }

    const blockExample = {};

    block[annotationName].push(blockExample);

    blockExample.description = [];
    blockExample.type = parsed.type?.name ? parsed.type?.name.toLowerCase() : 'form';
    blockExample.title = parsed.description || null;

    if (!block.contentType) {
      block.contentType = [];
    }

    if (!block.contentType.includes(blockExample.type)) {
      block.contentType.push(blockExample.type);
    }

    block.addToApidocString(toApidocString);

    return block;
  }

  function toApidocString(block) {
    if (block[annotationName] !== undefined) {
      return block[annotationName].map((annotation) => {
        const args = [];

        if (annotation.type) {
          args.push(`{${annotation.type}}`);
        }

        if (annotation.title) {
          args.push(annotation.title);
        }

        const apiAnnotation = `@api${annotationName.charAt(0).toUpperCase()}${annotationName.slice(1)}`;

        return [`${apiAnnotation} ${args.join(' ')}`, ...annotation.description];
      }).flat(1);
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
