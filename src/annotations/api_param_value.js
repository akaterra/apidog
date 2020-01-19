/**
 * @apiParamNote [(group)] value description
 */

const utils = require('../utils');

function construct(name) {
  const paramGroupName = `${name}Group`;
  const paramName = name;

  function addDescription(block, text) {
    block[paramName][block[paramName].length - 1].description.push(text);

    return block;
  }

  const regex = /^(\((.+)\)\s+|)(\{(.+)}\s+|)(\S+)(\s+(.*))?$/;

  function parse(block, text) {
    if (!text) {
      throw new Error(`@api${name[0].toUpperCase()}${name.slice(1)} malformed`);
    }

    if (!block[paramName]) {
      block[paramName] = [];
    }

    if (!block[paramGroupName]) {
      block[paramGroupName] = {};
    }

    const blockParam = {};

    block[paramName].push(blockParam);

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

    if (!block[paramGroupName][group || '$']) {
      block[paramGroupName][group || '$'] = [];
    }

    block[paramGroupName][group || '$'].push(blockParam);

    return block;
  }

  return {
    addDescription,
    parse,
  };
}

const param = construct('paramValue');

module.exports = {
  addDescription: param.addDescription,
  construct,
  parse: param.parse,
};
