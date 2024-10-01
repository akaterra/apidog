/**
 * @apiParamPrefix [(group)] prefix
 */

const utils = require('../utils');
const peggy = require('./peg/api_param_prefix');

function construct(name) {
  const annotationName = name;
  const annotationGroupName = `${name}Group`;
  const annotationStackName = `${name}Stack`;

  function parse(block, text) {
    if (!block[annotationStackName]) {
      block[annotationStackName] = [];
    }

    const parsed = peggy.parse(text.trim());

    let prefix = parsed.field?.name;
    let group = parsed.group?.name;

    if (!prefix && !group) {
      block[annotationName] = block[annotationGroupName] = undefined;
      block[annotationStackName] = [];
    } else {
      if (prefix === '..') {
        if (block[annotationStackName].length) {
          [ block[annotationName], block[annotationGroupName] ] = block[annotationStackName].pop();
        } else {
          block[annotationName] = block[annotationGroupName] = undefined;
        }
      } else {
        if (prefix) {
          block[annotationStackName].push([ block[annotationName], block[annotationGroupName] ]);
        } else {
          prefix = block[annotationName] ?? '';
        }

        block[annotationName] = block[annotationName] ? block[annotationName] + prefix : prefix;
        block[annotationGroupName] = group || block[annotationGroupName];
      }
    }

    return block;
  }

  return {
    parse,
  };
}

const paramPrefix = construct('paramPrefix');

module.exports = {
  construct,
  parse: paramPrefix.parse,
};
