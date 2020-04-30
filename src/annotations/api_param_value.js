/**
 * @apiParamNote [(group)] value description
 */

const utils = require('../utils');

function construct(name) {
  const annotationGroupName = `${name}Group`;
  const annotationName = name;

  function addDescription(block, text) {
    block[annotationName][block[annotationName].length - 1].description.push(text);

    return block;
  }

  const regex = /^(\((.+)\)\s+|)(\{(.+)}\s+|)(\S+)(\s+(.*))?$/;

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

    const tokens = regex.exec(text);

    if (!tokens) {
      throw new Error(`@api${name[0].toUpperCase()}${name.slice(1)} malformed`);
    }

    let group = tokens[2] || null;
    let type = tokens[4] || null;
    let value = tokens[5];
    let description = tokens[7] ? [tokens[7]] : [];

    if (type) {
      const typeTokens = utils.strSplitBy(type, '=', 1);

      type = {
        allowedValues: typeTokens[1] ? utils.strSplitByQuotedTokens(typeTokens[1]) : [],
        modifiers: typeTokens[0].split(':').reduce((acc, val) => {
          acc[val.toLowerCase()] = true;

          return acc;
        }, {}),
        name: typeTokens[0],
      }
    }

    blockParam.description = description;
    blockParam.group = group;
    blockParam.type = type;
    blockParam.value = value;

    if (!block[annotationGroupName][group || '$']) {
      block[annotationGroupName][group || '$'] = [];
    }

    block[annotationGroupName][group || '$'].push(blockParam);

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
