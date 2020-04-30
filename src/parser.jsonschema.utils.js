const fs = require('fs');
const utils = require('./utils');

function convert(spec, group, annotation, rootSpec, config) {
  validateInternal(spec, config);

  return resolveDefinition(spec, group, '', '', annotation, [], rootSpec, config);
}

function resolvePropertiesDefinition(properties, group, prefix, annotation, docBlock, rootSpec, config, required) {
  Object.entries(properties).forEach(([prop, spec]) => {
    resolveDefinition(spec, group, prefix, prop, annotation, docBlock, rootSpec, config, required);
  });
}

function resolveDefinition(spec, group, prefix, key, annotation, docBlock, rootSpec, config, required) {
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

  const paramDefault = spec.default ? `=${utils.quote(spec.default)}` : '';
  const paramGroup = group ? `(${group}) ` : '';
  const paramIsRequired = required ? required.includes(key) : false;
  const paramKey = paramIsRequired ? `${prefix ? prefix + '.' : ''}${key}${paramDefault}` : `[${prefix ? prefix + '.' : ''}${key}${paramDefault}]`;
  const paramTitle = spec.title ? ` ${spec.title}` : '';

  switch (spec.type) {
    case 'array':
      if (spec.items) {
        const { anyOf, oneOf, ...rest } = spec.items;
        const specVariants = [].concat(anyOf || []).concat(oneOf || []);

        if (!specVariants.length) {
          specVariants.push({});
        }

        specVariants.forEach((anyOf) => {
          if (anyOf.$ref) {
            resolveRef(rootSpec, anyOf, config);
          }

          const combinedSpec = { ...anyOf, ...rest };

          if (key) {
            for (const type of resolveType(combinedSpec.type, combinedSpec.enum)) {
              const paramEnum = combinedSpec.enum ? `=${[].concat(combinedSpec.enum).map(utils.quote).join(',')}` : '';

              docBlock.push(`${annotation} ${paramGroup}{${type}[]${paramEnum}} ${paramKey}${paramTitle}`);
            }
        
            if (spec.description) {
              docBlock.push(spec.description);
            }
          }

          resolveDefinition(
            combinedSpec,
            group,
            `${[prefix, key].filter(_ => _).join('.')}[]`, '',
            annotation,
            docBlock,
            rootSpec,
            config,
            spec.required,
          );
        });
      }

      break;

    case 'object':
      if (spec.properties) {
        const { anyOf, oneOf, ...rest } = spec;
        const specVariants = [].concat(anyOf || []).concat(oneOf || []);

        if (!specVariants.length) {
          specVariants.push({});
        }

        specVariants.forEach((anyOf) => {
          if (anyOf.$ref) {
            resolveRef(rootSpec, anyOf, config);
          }

          const combinedSpec = { ...anyOf, ...rest };

          if (key) {
            for (const type of resolveType(combinedSpec.type, combinedSpec.enum)) {
              const paramEnum = combinedSpec.enum ? `=${[].concat(combinedSpec.enum).map(utils.quote).join(',')}` : '';

              docBlock.push(`${annotation} ${paramGroup}{${type}${paramEnum}} ${paramKey}${paramTitle}`);
            }
        
            if (spec.description) {
              docBlock.push(spec.description);
            }
          }

          resolvePropertiesDefinition(
            combinedSpec.properties,
            group,
            `${[prefix, key].filter(_ => _).join('.')}`,
            annotation,
            docBlock,
            rootSpec,
            config,
            spec.required,
          );
        });
      }

      break;

    default:
      const { anyOf, oneOf, ...rest } = spec;
      const specVariants = [].concat(anyOf || []).concat(oneOf || []);

      if (!specVariants.length) {
        specVariants.push({});
      }

      specVariants.forEach((anyOf) => {
        if (anyOf.$ref) {
          resolveRef(rootSpec, anyOf, config);
        }

        const combinedSpec = { ...anyOf, ...rest };

        if (key) {
          for (const type of resolveType(combinedSpec.type, combinedSpec.enum)) {
            const paramEnum = combinedSpec.enum ? `=${[].concat(combinedSpec.enum).map(utils.quote).join(',')}` : '';

            docBlock.push(`${annotation} ${paramGroup}{${type}${paramEnum}} ${paramKey}${paramTitle}`);
          }
      
          if (spec.description) {
            docBlock.push(spec.description);
          }
        }
      });
  }

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
  return (Array.isArray(type) ? type : [type]).map((type) => {
    if (type) {
      switch (type.toLowerCase()) {
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
    }
  
    return isEnum ? 'String:Enum' : 'String';
  });
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
