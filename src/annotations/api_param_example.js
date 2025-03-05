/**
 * @apiParamExample [{type}] [(group)] [title]
 * [description]
 */

const utils = require('../utils');
const peggy = require('./peg/api_param_example');

function construct(name) {
  const annotationName = name ? `${name}Example` : 'example';
  const annotationGroupName = `exampleGroup`;

  function addDescription(block, text) {
    block[annotationName][block[annotationName].length - 1].description.push(text);

    return block;
  }

  function parse(block, text, line, index, lines, embeddedLines) {
    // if (!text) {
    //   throw new Error(`${fullName} malformed`);
    // }

    const parsed = peggy.parse(text.trim());

    let group = parsed.group || null;

    if (!block[annotationName]) {
      block[annotationName] = [];
    }

    if (!block[annotationGroupName]) {
      block[annotationGroupName] = {};
    }

    const blockExample = {};

    block[annotationName].push(blockExample);

    blockExample.description = [];
    blockExample.group = group;
    blockExample.statusCode = block.statusCode?.at(-1);
    blockExample.title = parsed.title || null;
    blockExample.type = parsed.type?.name ? parsed.type?.name.toLowerCase() : 'form';

    if (!block.contentType) {
      block.contentType = [];
    }

    if (!block.contentType.includes(blockExample.type)) {
      block.contentType.push(blockExample.type);
    }

    if (!block[annotationGroupName][group?.name ?? null]) {
      block[annotationGroupName][group?.name ?? null] = {
        prop: {},
        contentType: blockExample.type || block.contentType?.at(-1),
        statusCode: blockExample.statusCode,
      };
    }

    if (!block[annotationGroupName][group?.name ?? null].prop[name || 'param']) {
      block[annotationGroupName][group?.name ?? null].prop[name || 'param'] = [];
    }

    block[annotationGroupName][group?.name ?? null].prop[name || 'param'].push(blockExample);

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

const example = construct('param', '@apiExample');

module.exports = {
  addDescription: example.addDescription,
  construct,
  parse: example.parse,
  toApidocString: example.toApidocString,
};
