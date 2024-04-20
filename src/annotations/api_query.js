/**
 * @apiQuery [(group)] [{type=type}] [field[=defaultValue]] description
 */

const utils = require('../utils');

function construct(name, usePrefix) {
  const annotationGroupName = `${name}Group`;
  const annotationGroupVariantsName = `${name}GroupVariant`;
  const annotationName = name;
  const annotationPrefixName = `${name}Prefix`;

  function addDescription(block, text) {
    block[annotationName][block[annotationName].length - 1].description.push(text);

    return block;
  }

  const regex = /^(\((.+)\)\s+|)(\{(.+)}\s+|)(\[(.+?)]|(\S+\s*=\s*".+?(?<!\\)")|(\S+\s*=\s*\S+)|(\S+))(\s+(.*))?$/;

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

    if (!block[annotationGroupVariantsName]) {
      block[annotationGroupVariantsName] = {};
    }

    const blockParam = {};

    block[annotationName].push(blockParam);

    const tokens = regex.exec(text);

    if (!tokens) {
      throw new Error(`@api${name[0].toUpperCase()}${name.slice(1)} malformed`);
    }

    let group = tokens[2] || null;
    let type = tokens[4] || null;
    let field = tokens[6] || tokens[7] || tokens[8] || tokens[9];
    let description = tokens[11] ? [tokens[11]] : [];

    if (field) {
      const [fieldName, fieldDefaultValues] = utils.strSplitBy(field, '=', 1);

      field = {
        defaultValue: fieldDefaultValues ? utils.strSplitByQuotedTokens(fieldDefaultValues)[0] : undefined,
        isOptional: !!tokens[6],
        name: usePrefix && block[annotationPrefixName] ? block[annotationPrefixName] + fieldName : fieldName,
      }
    }

    if (type) {
      const [typeName, typeAllowedValues] = utils.strSplitBy(type, '=', 1);

      type = {
        allowedValues: typeAllowedValues ? utils.strSplitByQuotedTokens(typeAllowedValues) : [],
        modifiers: typeName.split(':').reduce((acc, val, ind) => {
          val = val.toLowerCase();

          while (val.slice(-2) === '[]') {
            acc.list = acc.list ? acc.list + 1 : 1;

            val = val.substr(0, val.length - 2);
          }

          if (ind === 0) {
            acc.initial = val;
          }

          acc[val] = true;

          if (val === 'parametrizedbody') {
            field.name = 'parametrizedBody';
          }

          if (val === 'rawbody') {
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

    if (!block[annotationGroupName][group || null]) {
      block[annotationGroupName][group || null] = { isTyped: false, list: [] };
    }

    block[annotationGroupName][group || null].list.push(block[annotationName].length - 1);

    if (!block[annotationGroupVariantsName][group]) {
      block[annotationGroupVariantsName][group] = { isTyped: false, prop: {} };
    }

    if (blockParam.field) {
      let root = block[annotationGroupVariantsName][group].prop;

      utils.forEach(utils.strSplitByEscaped(blockParam.field.name), (key, ind, isLast) => {
        const keysExtra = [];
        const keys = [key.replace(/(\[(\d*)\])+$/g, (_1, _2, keyMatch) => {
          keysExtra.push(keyMatch);

          return '';
        })].concat(keysExtra);
        const keysRoot = root;

        utils.forEach(keys, (subKey, subInd, subIsLast) => {
          if (!root[subKey]) {
            root[subKey] = [];
          }

          if ((isLast && subIsLast) || root[subKey].length === 0) {
            // last pushed param descriptor
            const list = [ block[annotationName].length - 1 ];

            // parent is not null when key is not last therefore has no its own param descriptor (list[0])
            const parent = isLast && subIsLast
              ? null
              : list[0];

            const variant = { list, parent, prop: {} };

            root[subKey].push(variant);

            root = variant.prop;
          } else {
            root = root[subKey][root[subKey].length - 1].prop;
          }
        });
      });
    }

    if (type) {
      block[annotationGroupName][group || null].isTyped = true; // @deprecated
      block[annotationGroupVariantsName][group || null].isTyped = true;
    }

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

        if (annotation.field) {
          const f = annotation.field;

          args.push(`${f.isOptional ? '' : '['}${f.name}${f.defaultValue ? '=' + utils.quote(f.defaultValue) : ''}${f.isOptional ? '' : ']'}`);
        }

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

const param = construct('param', true);

module.exports = {
  addDescription: param.addDescription,
  construct,
  parse: param.parse,
  toApidocString: param.toApidocString,
};
