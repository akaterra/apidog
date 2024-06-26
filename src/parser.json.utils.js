const fs = require('fs');
const utils = require('./utils');

function convert(json, annotation, config) {
  const defs = [];

  validate(json);
  resolveInternal(json, annotation, defs, '', config);

  return defs;
}

function resolveInternal(json, annotation, defs, prefix, config) {
  if (!json || typeof json !== 'object') {
    return;
  }

  Object.entries(json).forEach(([key, val]) => {
    let type;

    if (Array.isArray(val)) {
      type = '';

      while (true) {
        if (val.length) {
          val = val[0];
        } else {
          return;
        }

        type += '[]';

        if (!Array.isArray(val)) {
          type = `${resolveType(val)}${type}`;

          break;
        }

        // key += '[0]';
      }
    } else {
      type = resolveType(val);
    }

    if (type) {
      const isObject = type.substr(0, 6) === 'Object';

      defs.push(`${annotation} {${type}} ${prefix ? prefix + '.' + key : key}${!isObject && val !== '' ? '=' + utils.quote(val) : ''}`);
      
      if (isObject) {
        resolveInternal(val, annotation, defs, `${prefix ? prefix + '.' + key : key}`, config);
      }
    }
  });

  return defs;
}

function resolveType(type) {
  switch (typeof type) {
    case 'boolean':
      return 'Boolean';

    case 'number':
      return 'Number';
    
    case 'object':
      if (type === null) {
        return 'Null';
      } else if (!Array.isArray(type)) {
        return 'Object';
      }

      break;

    case 'string':
      return 'String';
  }

  return null;
}

function validate(json) {

}

module.exports = {
  convert,
  fetchSource: (source) => {
    if (source.slice(-5).toLowerCase() === '.json') {
      return JSON.parse(fs.readFileSync(source, 'utf8'));
    }

    throw new Error(`Unknown JSON source format "${source}"`);
  },
  resolveType,
  validate,
};
