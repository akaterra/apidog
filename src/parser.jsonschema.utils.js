const fs = require('fs');
const utils = require('./utils');
const NON_LETTERS_RGX = /[^a-z]/g;

function convert(spec, group, groupVariants, annotation, rootSpec, config) {
  validateInternal(spec, config);

  return resolveDefinition(spec, group, groupVariants, '', '', annotation, [], rootSpec, config);
}

function resolvePropertiesDefinition(properties, group, groupVariants, prefix, annotation, defs, rootSpec, config, required) {
  Object.entries(properties).forEach(([prop, spec]) => {
    resolveDefinition(spec, group, groupVariants, prefix, prop, annotation, defs, rootSpec, config, required);
  });
}

function resolveDefinition(spec, group, groupVariants, prefix, key, annotation, defs, rootSpec, config, required) {
  if (!defs) {
    defs = [];
  }

  if (!groupVariants) {
    groupVariants = {};
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

  const paramDefault = spec.default;
  const paramGroup = group;
  const paramIsRequired = required ? required.includes(key) : false;
  const paramKey = prefix ? prefix + '.' + key : key;
  const paramTitle = spec.title;

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
            resolveDefinitionBlocks(spec, combinedSpec, paramIsRequired, paramKey, paramDefault, defs, group, groupVariants);
          }

          resolveDefinition(
            combinedSpec,
            group,
            groupVariants,
            `${[prefix, key].filter(_ => _).join('.')}[]`, '',
            annotation,
            defs,
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
            resolveDefinitionBlocks(spec, combinedSpec, paramIsRequired, paramKey, paramDefault, defs, group, groupVariants);
          }

          resolvePropertiesDefinition(
            combinedSpec.properties,
            group,
            groupVariants,
            `${[prefix, key].filter(_ => _).join('.')}`,
            annotation,
            defs,
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
          resolveDefinitionBlocks(spec, combinedSpec, paramIsRequired, paramKey, paramDefault, defs, group, groupVariants);
        }
      });
  }

  return defs;
}

function resolveDefinitionBlocks(spec, combinedSpec, paramIsRequired, paramKey, paramDefault, defs, group, groupVariants) {
  for (const type of resolveType(combinedSpec.type, null, combinedSpec.enum)) {
    const paramEnum = combinedSpec.enum;
    const param = {
      field: { isOptional: !paramIsRequired, name: paramKey, defaultValue: paramDefault },
      type: { allowedValues: paramEnum, modifiers: { initial: combinedSpec.type, [combinedSpec.type]: true }, name: type },
      description: [],
    };

    if (!groupVariants[group]) {
      groupVariants[group] = { isTyped: false, prop: {} };
    }

    let root = groupVariants[group].prop['']?.[0]?.prop ?? groupVariants[group].prop;
    param.field.path = utils.strSplitByPathEscaped(param.field.name);

    utils.forEach(param.field.path, (key, ind, isLast) => {
      if (!root[key]) {
        root[key] = [];
      }

      if (isLast || root[key].length === 0) {
        // last pushed param descriptor
        const list = [ defs.length ];

        // parent is not null when key is not last therefore has no its own param descriptor (list[0])
        const parent = isLast ? null : list[0];
        const variant = { list, parent, prop: {} };

        root[key].push(variant);

        root = variant.prop;
      } else {
        root = root[key][root[key].length - 1].prop;
      }
    });

    if (spec.description) {
      param.description.push(spec.description);
    }

    if (typeof spec.maximum === 'number') {
      param.type.modifiers.max = spec.maximum;
      param.type.modifiers.isNumericRange = true;
    }

    if (typeof spec.minimum === 'number') {
      param.type.modifiers.min = spec.min;
      param.type.modifiers.isNumericRange = true;
    }

    if (typeof spec.maxItems === 'number') {
      param.type.modifiers.max = spec.maxItems;
      param.type.modifiers.isNumericRange = false;
    }

    if (typeof spec.minItems === 'number') {
      param.type.modifiers.min = spec.minItems;
      param.type.modifiers.isNumericRange = false;
    }

    if (typeof spec.maxLength === 'number') {
      param.type.modifiers.max = spec.maxLength;
      param.type.modifiers.isNumericRange = false;
    }

    if (typeof spec.minLength === 'number') {
      param.type.modifiers.min = spec.minLength;
      param.type.modifiers.isNumericRange = false;
    }

    defs.push(param);
  }
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

function resolveType(type, format, isEnum) {
  return (Array.isArray(type) ? type : [type]).map((type) => {
    if (type) {
      switch (type.toLowerCase()) {
        case 'boolean':
          return isEnum ? 'Boolean:Enum' : 'Boolean';
        case 'integer':
          return isEnum ? 'Integer:Enum' : 'Integer';
        case 'null':
          return 'Null';
        case 'number':
          return isEnum ? 'Number:Enum' : 'Number';
        case 'object':
          return 'Object';
        case 'string':
          if (format === 'date-time') {
            return isEnum ? 'Date:Enum' : 'Date';
          }

          if (format === 'password') {
            return isEnum ? 'Password:Enum' : 'Password';
          }

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


const SCHEMA_BY_TYPE = {
  currency: { type: 'string', minLength: 3, maxLength: 3 },
  date: true,
  datetime: { type:'string', format: 'date-time' },
  double: { type: 'number', format: 'double' },
  email: { type: 'string', format: 'email' },
  file: { type: 'string', format: 'binary' },
  hostname: { type: 'string', format: 'hostname' },
  id: { type: 'integer', minimum: 0 },
  int32: { type: 'integer', format: 'int32' },
  int64: { type: 'integer', format: 'int64' },
  ipv4: { type: 'string', format: 'ipv4' },
  ipv6: { type: 'string', format: 'ipv6' },
  longitude: { type: 'number', minimum: -180, maximum: 180 },
  latitude: { type: 'number', minimum: -90, maximum: 90 },
  natural: { type: 'integer', minimum: 1 },
  negative: { type: 'number', exclusiveMaximum: 0 },
  negativeinteger: { type: 'integer', exclusiveMaximum: 0 },
  phonenumber: { type: 'string', pattern: '^(\\+\\d{1,5}(-|\\s){0,3})?(\\(\\d{1,3}\\)(-|\\s){0,3})?(\\d{1,5}(-|\\s){0,3}){0,3}\\d+$', minLength: 8 },
  positive: { type: 'number', minimum: 0 },
  positiveinteger: { type: 'integer', minimum: 0 },
  password: { type: 'string', format: 'password' },
  secretkey: { type: 'string', format: 'password' },
  time: true,
  uri: { type: 'string', format: 'uri' },
  url: { type: 'string', format: 'uri' },
  uuid: { type: 'string', format: 'uuid' },
};
const SCHEMA_VALUE_BY_TYPE = {
  boolean: (value) => value && value !== '0' && value !== 'false' ? true : false,
  integer: (value) => parseInt(value),
  number: (value) => parseFloat(value),
};

function convertParamToJsonSchema(mixed, opts) {
  let type;

  if (mixed && typeof mixed === 'object') {
    type = mixed.type?.modifiers?.initial;
    param = mixed;
  } else {
    type = mixed;
    param = {};
  }

  const schemaByType = SCHEMA_BY_TYPE[type?.toLowerCase().replace(NON_LETTERS_RGX, '')];
  const schema = schemaByType && typeof schemaByType === 'object'
    ? { ...schemaByType }
    : {
      type: schemaByType
        ? schemaByType === true
          ? 'string'
          : schemaByType
        : type,
      format: schemaByType
        ? schemaByType === true
          ? type
          : schemaByType
        : undefined,
    };

  if (mixed.type?.modifiers?.regex) {
    schema.pattern = param.type.modifiers?.regex;
    schema.type = 'string';
  }

  if (mixed.field?.defaultValue !== undefined) {
    schema.default = convertParamValueByType(type, mixed.field.defaultValue);
  }

  if (mixed.type?.allowedValues?.length) {
    schema.enum = mixed.type.allowedValues.map((value) => convertParamValueByType(type, value));
  }

  if (mixed.type?.modifiers?.null) {
    if (opts?.newNullable) {
      schema.type = Array.from(new Set([ schema.type, 'null' ]));
    } else {
      schema.nullable = true;
    }
  }

  if (typeof mixed.type?.modifiers?.min === 'number') {
    if (mixed.type?.modifiers?.isNumericRange) {
      schema.minimum = mixed.type.modifiers.min;
    } else {
      schema.minLength = mixed.type.modifiers.min;
    }
  }

  if (typeof mixed.type?.modifiers?.max === 'number') {
    if (mixed.type?.modifiers?.isNumericRange) {
      schema.maximum = mixed.type.modifiers.max;
    } else {
      schema.maxLength = mixed.type.modifiers.max;
    }
  }

  return schema;
}

function convertParamValueByType(type, value) {
  return SCHEMA_VALUE_BY_TYPE[type] ? SCHEMA_VALUE_BY_TYPE[type](value) : value;
}

function convertParamGroupVariantToJsonSchema(paramGroupVariant, paramDescriptors, jsonSchema, opts) {
  if (!jsonSchema) {
    jsonSchema = {
      type: 'object',
      description: 'No description',
      required: [],
      properties: {},
      additionalProperties: false,
    };
  }

  Object.entries(paramGroupVariant).forEach(([ propKey, propVariants ]) => {
    const oneOf = propVariants.map((propVariant) => {
      const param = paramDescriptors[propVariant.list[0]];

      if (!param || param.type?.modifiers?.undefined) {
        return;
      }

      const paramJsonSchema = {
        type: 'object',
        description: param.description && param.description.join('\n'),
        required: [],
        properties: {},
        additionalProperties: false,
      };

      if (param.field && !param.field.isOptional && !jsonSchema.required.includes(propKey)) {
        jsonSchema.required.push(propKey);
      }

      let paramJsonSchemaRefPrev = paramJsonSchema;
      let paramJsonSchemaRef = paramJsonSchema;

      if (param.type?.modifiers?.list) {
        for (let i = 0; i < param.type.modifiers.list; i += 1) {
          paramJsonSchemaRef.type = 'array';
          paramJsonSchemaRef.items = {
            type: 'object',
            required: [],
            properties: {},
            additionalProperties: false,
          };

          if (typeof param.type?.modifiers?.listConstraints?.[i]?.min === 'number') {
            paramJsonSchemaRef.minItems = param.type.modifiers.listConstraints[i].min;
          }

          if (typeof param.type?.modifiers?.listConstraints?.[i]?.max === 'number') {
            paramJsonSchemaRef.maxItems = param.type.modifiers.listConstraints[i].max;
          }

          paramJsonSchemaRefPrev = paramJsonSchemaRef;
          paramJsonSchemaRef = paramJsonSchemaRef.items;
        }
      }

      Object.assign(paramJsonSchemaRef, convertParamToJsonSchema(param, opts));

      if (hasType(paramJsonSchemaRef, 'object')) {
        convertParamGroupVariantToJsonSchema(propVariant.prop, paramDescriptors, paramJsonSchemaRef);
      } else if (param.type?.modifiers?.list) {
        const paramJsonSchemaRefTmp = convertParamGroupVariantToJsonSchema(propVariant.prop, paramDescriptors);

        paramJsonSchemaRefPrev.prefixItems = Object.entries(paramJsonSchemaRefTmp.properties ?? {}).reduce((acc, [ key, def ]) => {
          acc[key] = def;

          return acc;
        }, []);
      }

      return removeEmptyRequiredAndProperties(paramJsonSchema);
    }).filter(_ => _);

    if (oneOf.length === 1) {
      jsonSchema.properties[propKey] = oneOf[0];
    } else {
      const oneOfVariants = oneOf.map((oneOf) => {
        if (oneOf.type !== 'array') {
          return oneOf;
        }

        return {
          description: oneOf.description,
          ...oneOf,
        };
      });

      jsonSchema.properties[propKey] = oneOfVariants.length === 1 ? oneOfVariants[0] : { oneOf: oneOfVariants };
    }
  });

  jsonSchema = removeEmptyRequiredAndProperties(jsonSchema);

  return Object.keys(jsonSchema).length === 1 && hasType(jsonSchema, 'object')
    ? null
    : jsonSchema;
}

function hasType(schema, type) {
  if (Array.isArray(schema.type) && schema.type.includes(type)) {
    return true;
  }

  return schema.type === type;
}

function removeEmptyRequiredAndProperties(jsonSchema) {
  if (jsonSchema.hasOwnProperty('description') && !jsonSchema.description) {
    delete jsonSchema.description;
  }

  if (jsonSchema.properties) {
    Object.entries(jsonSchema.properties).forEach(([ key, val ]) => {
      if (removeEmptyRequiredAndProperties(val) === undefined) {
        delete jsonSchema.properties[key];
      }
    });
  }

  if (jsonSchema.items) {
    jsonSchema.items = removeEmptyRequiredAndProperties(jsonSchema.items);
  }

  if (jsonSchema.items && Object.keys(jsonSchema.items).length === 0) {
    delete jsonSchema.items;
  }

  if (jsonSchema.prefixItems && !jsonSchema.prefixItems.length) {
    delete jsonSchema.prefixItems;
  }

  if (jsonSchema.required && jsonSchema.required.length === 0) {
    delete jsonSchema.required;
  }

  if (jsonSchema.properties && Object.keys(jsonSchema.properties).length === 0) {
    delete jsonSchema.properties;
  }

  if (jsonSchema.properties && Object.keys(jsonSchema.properties).length === 0) {
    delete jsonSchema.additionalProperties;
  }

  if (typeof jsonSchema.additionalProperties === 'boolean' && !hasType(jsonSchema, 'object')) {
    delete jsonSchema.additionalProperties;
  }

  if (jsonSchema.oneOf && !jsonSchema.oneOf.length) {
    delete jsonSchema.oneOf;
  }

  if (jsonSchema.properties?.['']) {
    jsonSchema = jsonSchema.properties[''];
  }

  if (jsonSchema.properties?.[utils.root]) {
    jsonSchema = jsonSchema.properties[utils.root];
  }

  return Object.keys(jsonSchema).length === 0 ? undefined : jsonSchema;
}

module.exports = {
  convert,
  convertParamToJsonSchema,
  convertParamValueByType,
  convertParamGroupVariantToJsonSchema,
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
