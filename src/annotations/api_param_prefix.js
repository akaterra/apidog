/**
 * @apiParamPrefix prefix
 */

const utils = require('../utils');

function construct(name) {
  const annotationName = name;
  const annotationStackName = `${name}Stack`;

  function parse(block, text) {
    if (!block[annotationStackName]) {
      block[annotationStackName] = [];
    }

    if (!text) {
      block[annotationName] = undefined;
      block[annotationStackName] = [];
    } else {
      if (text === '..') {
        if (block[annotationStackName].length) {
          block[annotationName] = block[annotationStackName].pop();
        } else {
          block[annotationName] = undefined;
        }
      } else {
        if (block[annotationName]) {
          block[annotationStackName].push(block[annotationName]);
        }

        block[annotationName] = block[annotationName] ? block[annotationName] + text : text;
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
