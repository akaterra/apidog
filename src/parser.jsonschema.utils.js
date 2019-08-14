function convert(spec, group, token, rootSpec) {
  return resolveDefinition(spec, group, '', token, [], rootSpec);
}

function resolveDefinition(spec, group, prefix, token, docBlock, rootSpec) {
  if (!docBlock) {
    docBlock = [];
  }

  if (!prefix) {
    prefix = '';
  }

  if (!rootSpec) {
    rootSpec = spec;
  }

  if (!spec || typeof spec !== 'object') {
    throwError();
  }

  if (spec.$ref) {
    resolveRef(rootSpec, spec);
  }

  if (!spec.properties || typeof spec.properties !== 'object') {
    return docBlock;
  }

  if (spec.required && !Array.isArray(spec.required)) {
    throwError();
  }

  const required = spec.required || [];

  const paramGroup = group ? `(${group}) ` : '';

  Object.entries(spec.properties).forEach(([key, val]) => {
    if (val.$ref) {
      resolveRef(rootSpec, val);
    }

    const paramDefault = val.default ? `=${quote(val.default)}` : '';
    const paramEnum = val.enum ? `=${val.enum.map(quote).join(',')}` : '';
    const paramKey = required && required.indexOf(key) !== - 1
      ? `${prefix}${key}${paramDefault}`
      : `[${prefix}${key}${paramDefault}]`;
    const paramTitle = val.title ? ` ${val.title}` : '';

    switch (val.type) {
      case 'boolean':
      case 'number':
      case 'string':
        docBlock.push(`${token} ${paramGroup}{${resolveType(val.type)}${paramEnum}} ${paramKey}${paramTitle}`);

        if (val.description) {
          docBlock.push(val.description);
        }

        break;

      case 'array':
        docBlock.push(`${token} ${paramGroup}{${resolveType(val.item.type)}[]${paramEnum}} ${paramKey}${paramTitle}`);

        if (val.description) {
          docBlock.push(val.description);
        }

        if (val.item.properties) {
          resolveDefinition(val.item, group, `${prefix}${key}[].`, token, docBlock, rootSpec);
        }

        break;

      case 'object':
        docBlock.push(`${token} ${paramGroup}{${resolveType(val.type)}${paramEnum}} ${paramKey}${paramTitle}`);

        if (val.description) {
          docBlock.push(val.description);
        }

        if (val.properties) {
          resolveDefinition(val, group, `${prefix}${key}.`, token, docBlock, rootSpec);
        }

        break;
    }
  });

  return docBlock;
}

function quote(val) {
  if (typeof val === 'string' && val.indexOf(' ') !== - 1) {
    return `"${val.replace(/"/g, '\\"')}"`;
  }

  return val;
}

function resolveRef(spec, obj) {
  if (obj.$ref) {
    if (typeof obj.$ref !== 'string') {
      throwError();
    }

    const [schemaName, schemaPath] = obj.$ref.split('#', 2);

    if (schemaName) {
      throwError(`"${schemaName}" external reference is not supported`);
    }

    let refObj = spec;

    for (const key of schemaPath.split('/').slice(1)) {
      if (refObj && typeof refObj === 'object' && key in refObj) {
        refObj = refObj[key];
      } else {
        throwError(`"${schemaPath}" path not exists`);
      }
    }

    delete obj.$ref;

    if (refObj && typeof refObj === 'object') {
      Object.assign(obj, Object.assign(resolveRef(spec, refObj), obj));
    }
  }

  return obj;
}

function resolveType(type) {
  switch (type) {
    case 'boolean':
      return 'Boolean';

    case 'number':
      return 'Number';

    case 'object':
      return 'Object';

    case 'string':
      return 'String';
  }

  return 'String';
}

function throwError(message) {
  throw new Error(`Malformed JSON Schema specification${message ? `: ${message}` : ''}`);
}

module.exports = {
  convert,
  resolveDefinition,
  resolveType,
};
