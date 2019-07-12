/**
 * @apiParam [(group)] [{type=type}] [field[=defaultValue]] description
 */

const utils = require('../utils');

function construct(name, usePrefix) {
  const paramsGroupsName = `${name}sGroups`;
  const paramsName = `${name}s`;
  const paramsPrefixName = `${name}Prefix`;

  function addDescription(block, text) {
    block[paramsName][block[paramsName].length - 1].description.push(text);

    return block;
  }

  const regex = /^(\((.+)\)\s+|)(\{(.+)}\s+|)(\[(.+?)]|(\S+\s*=\s*".+?(?<!\\)")|(\S+\s*=\s*\S+)|(\S+))(\s+(.*))?$/;

  function parse(block, text) {
    if (!block[paramsName]) {
      block[paramsName] = [];
    }

    if (!block[paramsGroupsName]) {
      block[paramsGroupsName] = {};
    }

    const blockParam = {};

    block[paramsName].push(blockParam);

    const tokens = regex.exec(text);

    if (!tokens) {
      throw new Error('Malformed @apiParam');
    }

    let group = tokens[2] || null;
    let type = tokens[4] || null;
    let field = tokens[6] || tokens[7] || tokens[8] || tokens[9];
    let description = tokens[11] ? [tokens[11]] : [];

    if (field) {
      const fieldTokens = utils.strSplitBy(field, '=', 1);

      field = {
        defaultValue: fieldTokens[1] ? utils.strSplitByQuotedTokens(fieldTokens[1])[0] : null,
        isOptional: !!tokens[6],
        name: usePrefix && block[paramsPrefixName] ? block[paramsPrefixName] + fieldTokens[0] : fieldTokens[0],
      }
    }

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
    blockParam.field = field;
    blockParam.group = group;
    blockParam.type = type;

    if (!block[paramsGroupsName][group || '$']) {
      block[paramsGroupsName][group || '$'] = [];
    }

    block[paramsGroupsName][group || '$'].push(blockParam);

    return block;
  }

  return {
    addDescription,
    parse,
  };
}

const param = construct('param', true);

module.exports = {
  addDescription: param.addDescription,
  construct,
  parse: param.parse,
};
