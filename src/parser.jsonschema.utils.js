const fs = require('fs');
const utils = require('./utils');

function convert(spec, group, annotation, rootSpec, config) {
  validateInternal(spec, config);

  return resolveDefinition(spec, group, '', annotation, [], rootSpec, config);
}

function resolveDefinition(spec, group, prefix, annotation, docBlock, rootSpec, config) {
  if (!docBlock) {
    docBlock = [];
  }

  if (!prefix) {
    prefix = '';
  }

  if (!rootSpec) {
    rootSpec = spec;
  }

  if (spec.$ref) {
    resolveRef(rootSpec, spec, config);
  }

  if (!spec.properties || typeof spec.properties !== 'object') {
    return docBlock;
  }

  const required = spec.required || [];

  const paramGroup = group ? `(${group}) ` : '';

  Object.entries(spec.properties).forEach(([key, val]) => {
    if (val.$ref) {
      resolveRef(rootSpec, val, config);
    }

    const paramDefault = val.default ? `=${utils.quote(val.default)}` : '';
    const paramIsRequired = required.indexOf(key) !== - 1;
    const paramEnum = val.enum ? `=${[].concat(val.enum).map(utils.quote).join(',')}` : '';
    const paramKey = paramIsRequired ? `${prefix}${key}${paramDefault}` : `[${prefix}${key}${paramDefault}]`;
    const paramTitle = val.title ? ` ${val.title}` : '';

    switch (val.type) {
      case 'array':
        docBlock.push(`${annotation} ${paramGroup}{${resolveType(val.items.type)}[]${paramEnum}} ${paramKey}${paramTitle}`);

        if (val.description) {
          docBlock.push(val.description);
        }

        if (val.items.properties) {
          resolveDefinition(val.items, group, `${prefix}${key}[].`, annotation, docBlock, rootSpec, config);
        }

        break;

      case 'object':
        docBlock.push(`${annotation} ${paramGroup}{${resolveType(val.type)}${paramEnum}} ${paramKey}${paramTitle}`);

        if (val.description) {
          docBlock.push(val.description);
        }

        if (val.properties) {
          resolveDefinition(val, group, `${prefix}${key}.`, annotation, docBlock, rootSpec, config);
        }

        break;

      default:
        docBlock.push(`${annotation} ${paramGroup}{${resolveType(val.type, val.enum)}${paramEnum}} ${paramKey}${paramTitle}`);

        if (val.description) {
          docBlock.push(val.description);
        }

        break;
    }
  });

  return docBlock;
}

function resolveRef(spec, obj, config) {
  if (obj.$ref) {
    if (typeof obj.$ref !== 'string') {
      throwErrorVia(config);
    }

    const [schemaName, schemaPath] = obj.$ref.split('#', 2);

    if (schemaName) {
      spec = config.schema.jsonschema[schemaName];

      if (!spec) {
        throwErrorVia(config, `"${schemaName}" external reference not exists`);
      }
    }

    let refObj = spec;

    for (const key of schemaPath.split('/').slice(1)) {
      if (refObj && typeof refObj === 'object' && key in refObj) {
        refObj = refObj[key];
      } else {
        throwErrorVia(config, `"${schemaPath}" path not exists`);
      }
    }

    delete obj.$ref;

    if (refObj && typeof refObj === 'object') {
      Object.assign(obj, Object.assign(resolveRef(spec, refObj, config), obj));
    }
  }

  return obj;
}

function resolveType(type, isEnum) {
  if (Array.isArray(type)) {
    if (type.length > 1) {
      if (type.includes('null')) {
        type = type.filter((t) => t !== 'null').concat(['null']);
      }
    }

    return isEnum ? `${type.map(_ => resolveType(_)).join(':')}:Enum` : type.map(_ => resolveType(_)).join(':');
  }

  switch (type) {
    case 'boolean':
      return isEnum ? 'Boolean:Enum' : 'Boolean';

    case 'null':
      return 'Null';

    case 'number':
      return isEnum ? 'Number:Enum' : 'Number';

    case 'object':
      return 'Object';

    case 'string':
      return isEnum ? 'String:Enum' : 'String';
  }

  return 'String';
}

function throwError(message) {
  throw new Error(`Malformed JSON Schema specification${message ? `: ${message}` : ''}`);
}

function throwErrorVia(config, message) {
  config.logger.throw(`Malformed JSON Schema specification${message ? `: ${message}` : ''}`);
}

function validate(spec, config) {
  if (!spec || typeof spec !== 'object') {
    throwErrorVia(config);
  }

  if (!spec.id && !spec.$id) {
    throwErrorVia(config);
  }

  if (spec.id && typeof spec.id !== 'string') {
    throwErrorVia(config);
  }

  if (spec.$id && typeof spec.$id !== 'string') {
    throwErrorVia(config);
  }

  if (spec.required && !Array.isArray(spec.required)) {
    throwErrorVia(config);
  }
}

function validateInternal(spec, config) {
  if (!spec || typeof spec !== 'object') {
    throwErrorVia(config);
  }

  if (spec.required && !Array.isArray(spec.required)) {
    throwErrorVia(config);
  }
}

module.exports = {
  convert,
  fetchSource: (source) => {
    if (source.slice(-5).toLowerCase() === '.json') {
      return JSON.parse(fs.readFileSync(source, 'utf8'));
    }

    throw new Error(`Unknown JSON Schema source format "${source}"`);
  },
  resolveDefinition,
  resolveType,
  validate,
  validateInternal,
};
