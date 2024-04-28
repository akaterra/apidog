/**
 * @apiParamExample [{type}] [title]
 * [description]
 */

const utils = require('../utils');

function construct(name) {
  const annotationName = name ? `${name}Example` : 'example';

  function addDescription(block, text) {
    block[annotationName][block[annotationName].length - 1].description.push(text);

    return block;
  }

  const regex = /^({(.+)})?(.+)?/;

  function parse(block, text, line, index, lines, embeddedLines) {
    // if (!text) {
    //   throw new Error(`${fullName} malformed`);
    // }

    const tokens = regex.exec(text);

    if (!tokens) {
      throw new Error(`@api${name[0].toUpperCase()}${name.slice(1)} malformed`);
    }

    if (!block[annotationName]) {
      block[annotationName] = [];
    }

    const blockExample = {};

    block[annotationName].push(blockExample);

    blockExample.description = [];
    blockExample.type = tokens[2] ? tokens[2].toLowerCase() : 'form';
    blockExample.title = tokens[3] ? tokens[3].trim() : null;

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
