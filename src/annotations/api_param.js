/**
 * @apiParam [(group)] [{type=type}] [field[=defaultValue]] description
 */

const utils = require('../utils');
const peggy = require('./peg/api_param');

function construct(name, usePrefix) {
  const annotationContentTypeName = `${name}ContentType`;
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

    let group = parsed.group || block[annotationPrefixGroupName] || null;
    let type = null;
    let field = null;
    let description = parsed.description ? parsed.description.split('\n') : [];
    let isFieldForReinit = false;
    let isFieldForRemove = false;

    if (parsed.field) {
      if (parsed.field.name.startsWith('^')) {
        parsed.field.name = parsed.field.name.slice(1);
        isFieldForReinit = true;
      } else if (parsed.field.name.startsWith('!')) {
        parsed.field.name = parsed.field.name.slice(1);
        isFieldForRemove = true;
      }

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
            acc.list = (acc.list ?? 0) + 1;

            if (!acc.listConstraints) {
              acc.listConstraints = [];
            }

            acc.listConstraints.push({
              isNumericRange: modifier.isNumeric,
              min: modifier.min,
              max: modifier.max,
            });
          }

          if (!modifier.name) {
            return acc;
          }

          if (initial === 'regex' && !modifier.list) {
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

    const groupName = group?.name || null;

    if (!block[annotationGroupName][groupName]) {
      block[annotationGroupName][groupName] = {
        isTyped: false,
        list: [],
        contentType: block[annotationContentTypeName]?.at(-1) ?? block.contentType?.at(-1),
        statusCode: block.statusCode?.at(-1),
      };
    }

    block[annotationGroupName][groupName].list.push(block[annotationName].length - 1);

    if (!block[annotationGroupVariantsName][groupName]) {
      block[annotationGroupVariantsName][groupName] = {
        isTyped: false,
        prop: {},
        contentType: block[annotationContentTypeName]?.at(-1) ?? block.contentType?.at(-1),
        statusCode: block.statusCode?.at(-1),
      };
    }

    if (blockParam.field) {
      const rootProp = block[annotationGroupVariantsName][groupName].prop[utils.root];
      let root = rootProp?.length
        ? rootProp[rootProp.length - 1]?.prop
        : block[annotationGroupVariantsName][groupName].prop;
      blockParam.field.path = utils.strSplitByPathEscaped(blockParam.field.name);

      utils.forEach(blockParam.field.path, (key, ind, isLast) => {
        if (!root[key]) {
          root[key] = [];
        }

        if (isLast || root[key].length === 0) {
          if (isFieldForRemove) {
            delete root[key];

            return;
          }

          // last pushed param descriptor
          const list = [ block[annotationName].length - 1 ];

          // parent is not null when key is not last therefore has no its own param descriptor (list[0])
          const parent = isLast ? null : list[0];
          const variant = { list, parent, prop: {} };

          if (isFieldForReinit) {
            root[key] = [];
          }

          root[key].push(variant);

          root = variant.prop;
        } else {
          root = root[key][root[key].length - 1].prop;
        }
      });
    }

    if (type) {
      block[annotationGroupName][groupName].isTyped = true; // @deprecated
      block[annotationGroupVariantsName][groupName].isTyped = true;
    }

    block.addToApidocString(toApidocString);

    return block;
  }

  function toApidocString(block) {
    if (block[annotationName] !== undefined) {
      return block[annotationName].map((annotation) => {
        const isRoot = annotation.field?.name === utils.root;
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
