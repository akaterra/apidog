/**
 * @apiParam [(group)] [{type=type}] [field[=defaultValue]] description
 */

const utils = require('../utils');
const peggy = require('./peg/api_param');

function construct(name, usePrefix) {
  const annotationGroupName = `${name}Group`;
  const annotationGroupVariantsName = `${name}GroupVariant`;
  const annotationName = name;
  const annotationPrefixName = `${name}Prefix`;
  const annotationPrefixGroupName = `${name}PrefixGroup`;

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

    if (!block[annotationGroupVariantsName]) {
      block[annotationGroupVariantsName] = {};
    }

    const blockParam = {};

    block[annotationName].push(blockParam);

    const parsed = peggy.parse(text.trim());

    let group = parsed.group?.name || block[annotationPrefixGroupName] || null;
    let type = null;
    let field = null;
    let description = parsed.description ? parsed.description.split('\n') : [];

    if (parsed.field) {
      field = {
        defaultValue: parsed.field.defaultValue,
        isOptional: !parsed.field.isRequired,
        name: usePrefix && block[annotationPrefixName] ? block[annotationPrefixName] + parsed.field.name : parsed.field.name,
      };
    }

    if (parsed.type) {
      const initial = parsed.type.name.toLowerCase();

      type = {
        allowedValues: parsed.type.enum ?? [],
        modifiers: parsed.type.modifiers?.reduce((acc, modifier, i) => {
          if (modifier.list) {
            acc.list = modifier.list;
          }

          if (!modifier.name) {
            return acc;
          }

          if (initial === 'regex' && i === 0) {
            acc.regex = modifier.name;

            return acc;
          }

          let name = modifier.name.toLowerCase();

          while (name.slice(-2) === '[]') {
            acc.list = acc.list ? acc.list + 1 : 1;

            name = name.slice(0, -2);
          }

          if (name === 'parametrizedbody') {
            field.name = 'parametrizedBody';
          }

          if (name === 'rawbody') {
            field.name = 'rawBody';
          }

          acc[name] = true;

          return acc;
        }, {
          initial,
          isNumericRange: parsed.type.isNumeric,
          min: parsed.type.min,
          max: parsed.type.max,
          regex: null,
          [parsed.type.name.toLowerCase()]: true,
        }),
        name: parsed.type.name + parsed.type.modifiers?.map((modifier) => {
          let name = modifier.name ? `:${modifier.name}` : '';

          if (modifier.list) {
            name += `[]`.repeat(modifier.list);
          }

          return name;
        }).join(''),
      };
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
      const rootProp = block[annotationGroupVariantsName][group].prop[''];
      let root = rootProp?.length
        ? rootProp[rootProp.length - 1]?.prop
        : block[annotationGroupVariantsName][group].prop;
      blockParam.field.path = [ ...utils.strSplitByPathEscaped(blockParam.field.name) ];

      utils.forEach(blockParam.field.path, (key, ind, isLast) => {
        if (!root[key]) {
          root[key] = [];
        }

        if (isLast || root[key].length === 0) {
          // last pushed param descriptor
          const list = [ block[annotationName].length - 1 ];

          // parent is not null when key is not last therefore has no its own param descriptor (list[0])
          const parent = isLast ? null : list[0];
          const variant = { list, parent, prop: {} };

          root[key].push(variant);

          root = variant.prop;
        } else {
          root = root[key][root[key].length - 1].prop;
        }
      });
    }

    if (type) {
      block[annotationGroupName][group || null].isTyped = true; // @deprecated
      block[annotationGroupVariantsName][group || null].isTyped = true;
    }

    block.addToApidocString(toApidocString);

    return block;
  }

  function toApidocString(block) {
    if (block[annotationName] !== undefined) {
      return block[annotationName].map((annotation) => {
        const isRoot = annotation.field?.name === '';
        const args = [];

        if (annotation.group) {
          args.push(`(${annotation.group})`);
        }

        if (annotation.type) {
          const t = annotation.type;

          args.push(`{${t.name}${t.allowedValues.length ? '=' + t.allowedValues.map(utils.quote).join(',') : ''}}`);
        }

        if (annotation.field && !isRoot) {
          const f = annotation.field;

          args.push(`${f.isOptional ? '' : '['}${f.name}${f.defaultValue ? '=' + utils.quote(f.defaultValue) : ''}${f.isOptional ? '' : ']'}`);
        }

        if (annotation.description.length) {
          args.push(annotation.description[0]);
        }

        const apiAnnotation = isRoot
          ? `@api${name.charAt(0).toUpperCase()}${name.slice(1)}Root`
          : `@api${name.charAt(0).toUpperCase()}${name.slice(1)}`;

        return [`${apiAnnotation} ${args.join(' ')}`, ...annotation.description.slice(1)];
      }).flat(1);
    }
  
    return null;
  }

  toApidocString.group = name;

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
