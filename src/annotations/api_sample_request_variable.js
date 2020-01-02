/**
 * @apiSampleRequestVariable [(namespace)] [{responsePath}] field[=defaultValue]
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

const regex = /^(\((.+)\)\s+|)(\{(.+)}\s+|)((\w+\s*=\s*".+?(?<!\\)")|(\w+\s*=\s*\S+)|(\w+))$/;

function parse(block, text) {
  if (!block.sampleRequestVariable) {
    block.sampleRequestVariable = [];
  }

  const blockSrVariable = {};

  block.sampleRequestVariable.push(blockSrVariable);

  const annotations = regex.exec(text);

  if (!annotations) {
    throw new Error('Malformed @apiParam');
  }

  let ns = annotations[2] || null;
  let responsePath = annotations[4] || null;
  let field = annotations[6] || annotations[7] || annotations[8];

  if (field) {
    const fieldTokens = utils.strSplitBy(field, '=', 1);

    field = {
      defaultValue: fieldTokens[1] ? utils.strSplitByQuotedTokens(fieldTokens[1])[0] : null,
      name: fieldTokens[0],
    }
  }

  blockSrVariable.field = field;
  blockSrVariable.ns = ns;
  blockSrVariable.responsePath = responsePath;

  return block;
}

module.exports = {
  addDescription,
  parse,
};
