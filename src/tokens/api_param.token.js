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
      const [fieldName, fieldDefaultValues] = utils.strSplitBy(field, '=', 1);

      field = {
        defaultValue: fieldDefaultValues ? utils.strSplitByQuotedTokens(fieldDefaultValues)[0] : null,
        isOptional: !!tokens[6],
        name: usePrefix && block[paramsPrefixName] ? block[paramsPrefixName] + fieldName : fieldName,
      }
    }

    if (type) {
      const [typeName, typeAllowedValues] = utils.strSplitBy(type, '=', 1);

      type = {
        allowedValues: typeAllowedValues ? utils.strSplitByQuotedTokens(typeAllowedValues) : [],
        modifiers: typeName.split(':').reduce((acc, val, ind) => {
          if (val.slice(-2) === '[]') {
            acc.list = true;

            val = val.substr(0, val.length - 2);
          }

          if (ind === 0) {
            acc.self = val.toLowerCase();
          }

          acc[val.toLowerCase()] = true;

          if (val.toLowerCase() === 'parametrizedbody') {
            field.name = 'parametrizedBody';
          }

          if (val.toLowerCase() === 'rawbody') {
            field.name = 'rawBody';
          }

          return acc;
        }, {}),
        name: typeName,
      }
    }

    blockParam.description = description;
    blockParam.field = field;
    blockParam.group = group;
    blockParam.type = type;

    if (!block[paramsGroupsName][group || '$']) {
      block[paramsGroupsName][group || '$'] = {isTyped: true, list: []};
    }

    block[paramsGroupsName][group || '$'].isTyped &= !!type;
    block[paramsGroupsName][group || '$'].list.push(blockParam);

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
