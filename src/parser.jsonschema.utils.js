function convert(spec, group, token) {
  return resolveDefinition(spec, group, '', token, []);
}

function resolveDefinition(spec, group, prefix, token, docBlock) {
  if (!docBlock) {
    docBlock = [];
  }

  if (!prefix) {
    prefix = '';
  }

  if (!spec || typeof spec !== 'object') {
    throwError();
  }

  if (!spec.properties || typeof spec.properties !== 'object') {
    throwError();
  }

  if (spec.required && !Array.isArray(spec.required)) {
    throwError();
  }

  const required = spec.required || [];

  const paramGroup = group ? `(${group}) ` : '';

  Object.entries(spec.properties).forEach(([key, val]) => {
    const paramDefault = val.default ? `=${quote(val.default)}` : '';
    const paramEnum = val.enum ? `=${val.enum.map(quote).join(',')}` : '';
    const paramKey = required && required.indexOf(key) !== - 1
      ? `${prefix}${key}${paramDefault}`
      : `[${prefix}${key}${paramDefault}]`;
    const paramTitle = val.title ? ` ${val.title}` : '';

    if (val.$ref) {
      throwError(`"$ref" is not supported`);
    }

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
          resolveDefinition(val.item, group, `${prefix}${key}[].`, token, docBlock);
        }

        break;

      case 'object':
        docBlock.push(`${token} ${paramGroup}{${resolveType(val.type)}${paramEnum}} ${paramKey}${paramTitle}`);

        if (val.description) {
          docBlock.push(val.description);
        }

        if (val.properties) {
          resolveDefinition(val, group, `${prefix}${key}.`, token, docBlock);
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
