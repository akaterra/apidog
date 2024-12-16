const utils = require('./utils');
const NON_LETTERS_RGX = /[^a-z]/g;

function enumChapters(chapters, fn, acc, scope) {
  Object.entries(chapters).forEach(([chapterName, groups]) => {
    Object.entries(groups).forEach(([groupName, subgroups]) => {
      Object.entries(subgroups).forEach(([subgroupName, names]) => {
        Object.entries(names).forEach(([name, versions]) => {
          Object.entries(versions).forEach(([versionName, descriptor]) => {
            if (scope) {
              if (scope === 'api' && !descriptor.api) {
                return;
              }

              if (scope === 'note' && !descriptor.note) {
                return;
              }
            }

            fn({
              chapterName,
              groups,
              groupName,
              subgroups,
              subgroupName,
              names,
              name,
              versions,
              versionName,
              descriptor,
            }, acc);
          });
        });
      });
    });
  });

  return acc;
}

function enumChaptersApis(chapters, fn, acc) {
  return enumChapters(chapters, fn, acc, 'api');
}

function enumChaptersNotes(chapters, fn, acc) {
  return enumChapters(chapters, fn, acc, 'note');
}

function enumUriPlaceholders(uri, fn, acc) {
  const placeholderRegex = /:(\w+)/g;
  const pathQsIndex = uri.indexOf('?');

  let placeholder;

  while (placeholder = placeholderRegex.exec(pathQsIndex !== -1 ? uri.substr(0, pathQsIndex) : uri)) {
    fn(placeholder[1], false, acc);
  }

  if (pathQsIndex !== -1) {
    while (placeholder = placeholderRegex.exec(uri.substr(pathQsIndex + 1))) {
      fn(placeholder[1], true, acc);
    }
  }

  return acc;
}

const SCHEMA_BY_TYPE = {
  date: true,
  datetime: { type:'string', format: 'date-time' },
  'date-time': { type:'string', format: 'date-time' },
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

function convertParamToJsonSchema(mixed) {
  let type;

  if (mixed && typeof mixed === 'object') {
    type = mixed.type?.modifiers?.initial;
    param = mixed;
  } else {
    type = mixed;
    param = {};
  }

  const def = SCHEMA_BY_TYPE[type?.toLowerCase().replace(NON_LETTERS_RGX, '')];

  if (def && typeof def === 'object') {
    return def;
  }

  const schema = {
    type: type in SCHEMA_BY_TYPE
      ? def === true
        ? 'string'
        : SCHEMA_BY_TYPE[type]
      : type,
    format: type in SCHEMA_BY_TYPE
      ? def === true
        ? type
        : SCHEMA_BY_TYPE[type]
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
    schema.type = Array.from(new Set([ schema.type, 'null' ]));
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

function convertParamGroupVariantToJsonSchema(paramGroupVariant, paramDescriptors, jsonSchema) {
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

      let paramJsonSchemaRef = paramJsonSchema;

      if (param.type?.modifiers?.list) {
        for (let i = 0; i < param.type.modifiers.list; i += 1) {
          paramJsonSchemaRef.type = 'array';
          paramJsonSchemaRef.items = {
            type: 'object',
            required: [],
            properties: {},
            additionalProperties: false,
          }

          if (typeof param.type?.modifiers?.listConstraints?.[i]?.min === 'number') {
            paramJsonSchemaRef.minItems = param.type.modifiers.listConstraints[i].min;
          }

          if (typeof param.type?.modifiers?.listConstraints?.[i]?.max === 'number') {
            paramJsonSchemaRef.maxItems = param.type.modifiers.listConstraints[i].max;
          }

          paramJsonSchemaRef = paramJsonSchemaRef.items;
        }
      }

      Object.assign(paramJsonSchemaRef, convertParamToJsonSchema(param));

      if (hasType(paramJsonSchemaRef, 'object')) {
        convertParamGroupVariantToJsonSchema(propVariant.prop, paramDescriptors, paramJsonSchemaRef);
      }

      return removeEmptyRequiredAndProperties(paramJsonSchema);
    }).filter(_ => _);

    if (oneOf.length === 1) {
      jsonSchema.properties[propKey] = oneOf[0];
    } else {
      oneOf.forEach((oneOf, i) => oneOf.index = i);

      const oneOfNonArrayVariants = oneOf.filter((oneOf) => oneOf.type !== 'array');
      const oneOfArrayVariants = oneOf.some((oneOf) => oneOf.type === 'array')
        ? [ {
          type: 'array',
          items: {
            oneOf: oneOf.filter((oneOf) => oneOf.type === 'array').map((oneOf) => ({ description: oneOf.description, ...oneOf.items, index: oneOf.index })),
          },
        } ]
        : [];

      if (oneOfArrayVariants[0]?.items.oneOf.length === 1) {
        oneOfArrayVariants[0].items = oneOfArrayVariants[0].items.oneOf[0];
      }

      let oneOfVariants = [];

      oneOfNonArrayVariants.forEach((oneOfNonArrayVariant) => {
        if (oneOfNonArrayVariant.index !== Infinity) {
          oneOfVariants[oneOfNonArrayVariant.index] = oneOfNonArrayVariant;
        }
      });
      oneOfArrayVariants.forEach((oneOfArrayVariant) => {
        if (oneOfArrayVariant.items.index !== Infinity) {
          oneOfVariants[oneOfArrayVariant.items.index] = oneOfArrayVariant;
        }
      });
      oneOfNonArrayVariants.forEach((oneOfNonArrayVariant) => {
        if (oneOfNonArrayVariant.index === Infinity) {
          oneOfVariants.push(oneOfNonArrayVariant);
        }
      });
      oneOfArrayVariants.forEach((oneOfArrayVariant) => {
        if (oneOfArrayVariant.items.index === Infinity) {
          oneOfVariants.push(oneOfArrayVariant);
        }
      });

      oneOfVariants = oneOfVariants.filter((e) => !!e);
      oneOfVariants.forEach((e) => delete e.index);
      oneOfVariants.forEach((e) => delete e.items?.index);

      if (propKey === 'mapping') {
        throw 3;
      }

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

function addUriDefaultScheme(uri) {
  if (!/^\w+:\/\//.test(uri)) {
    return `scheme://domain${uri[0] === '/' ? '' : '/'}${uri}`;
  }

  return uri;
}

module.exports = {
  addUriDefaultScheme,
  convertParamToJsonSchema,
  convertParamValueByType,
  enumChapters,
  enumChaptersApis,
  enumChaptersNotes,
  enumUriPlaceholders,
  convertParamGroupVariantToJsonSchema,
};
