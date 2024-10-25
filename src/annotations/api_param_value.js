/**
 * @apiParamValue [(group)] value description
 */

const utils = require('../utils');
const peggy = require('./peg/api_param_value');

function construct(name) {
  const annotationGroupName = `${name}Group`;
  const annotationName = name;

  function addDescription(block, text) {
    block[annotationName][block[annotationName].length - 1].description.push(text);

    return block;
  }

  function parse(block, text) {
    if (!text) {
      throw new Error(`@api${name[0].toUpperCase()}${name.slice(1)} malformed`);
    }

    if (!block[annotationName]) {
      block[annotationName] = [];
    }

    if (!block[annotationGroupName]) {
      block[annotationGroupName] = {};
    }

    const blockParam = {};

    block[annotationName].push(blockParam);

    const parsed = peggy.parse(text.trim());

    let group = parsed.group?.name || null;
    let type = parsed.type || null;
    let value = parsed.value;
    let description = parsed.description ?? null;

    blockParam.description = description;
    blockParam.group = group;
    blockParam.type = type;
    blockParam.value = value;

    if (!block[annotationGroupName][group || '$']) {
      block[annotationGroupName][group || '$'] = [];
    }

    block[annotationGroupName][group || '$'].push(blockParam);
    block.addToApidocString(toApidocString);

    return block;
  }

  function toApidocString(block) {
    if (block[annotationName] !== undefined) {
      return block[annotationName].map((annotation) => {
        const args = [];

        if (annotation.group) {
          args.push(`(${annotation.group})`);
        }

        if (annotation.type) {
          const t = annotation.type;

          args.push(`{${t.name}${t.allowedValues.length ? '=' + t.allowedValues.map(utils.quote).join(',') : ''}}`);
        }

        args.push(utils.quote(annotation.value));

        if (annotation.description.length) {
          args.push(annotation.description[0]);
        }

        const apiAnnotation = `@api${name.charAt(0).toUpperCase()}${name.slice(1)}`;

        return [`${apiAnnotation} ${args.join(' ')}`, ...annotation.description.slice(1)];
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

const param = construct('paramValue');

module.exports = {
  addDescription: param.addDescription,
  construct,
  parse: param.parse,
  toApidocString: param.toApidocString,
};
