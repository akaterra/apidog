/**
 * @apiSampleRequestVariable [(namespace)] [{responsePath}] field[=defaultValue]
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

const regex = /^(\((.+)\)\s+|)(\{(.+)}\s+|)((\w+\s*=\s*".+?(?<!\\)")|(\w+\s*=\s*\S+)|(\w+))$/;

function parse(block, text) {
  if (!text) {
    throw new Error(`@api${name[0].toUpperCase()}${name.slice(1)} malformed`);
  }

  if (!block.sampleRequestVariable) {
    block.sampleRequestVariable = [];
  }

  const blockSrVariable = {};

  block.sampleRequestVariable.push(blockSrVariable);

  const tokens = regex.exec(text);

  if (!tokens) {
    throw new Error(`@api${name[0].toUpperCase()}${name.slice(1)} malformed`);
  }

  let ns = tokens[2] || null;
  let responsePath = tokens[4] || null;
  let field = tokens[6] || tokens[7] || tokens[8];

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
  block.addToApidocString(toApidocString);

  return block;
}

function toApidocString(block) {
  if (block.sampleRequestVariable !== undefined) {
    return block.sampleRequestVariable.map((annotation) => {
      const args = [];

      if (annotation.ns) {
        args.push(`(${annotation.ns})`);
      }

      if (annotation.responsePath) {
        args.push(`{${annotation.responsePath}}`);
      }

      if (annotation.field) {
        const f = annotation.field;

        args.push(`${f.isOptional ? '' : '['}${f.name}${f.defaultValue ? '=' + utils.quote(f.defaultValue) : ''}${f.isOptional ? '' : ']'}`);
      }

      return `apiSampleRequestVariable ${args.join(' ')}`;
    }).flat(1);
  }

  return null;
}

module.exports = {
  addDescription,
  parse,
  toApidocString,
};
