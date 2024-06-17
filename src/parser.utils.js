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
  datetime: 'date-time',
  'date-time': true,
  email: true,
  hostname: true,
  id: { type: 'integer', minimum: 0 },
  ipv4: true,
  ipv6: true,
  longitude: { type: 'number', minimum: -180, maximum: 180 },
  latitude: { type: 'number', minimum: -90, maximum: 90 },
  natural: { type: 'integer', minimum: 1 },
  negativeInteger: { type: 'integer', maximum: -1 },
  positiveInteger: { type: 'integer', minimum: 0 },
  password: { type: 'string', format: 'password' },
  time: true,
  uri: true,
  uuid: true,
};
const SCHEMA_VALUE_BY_TYPE = {
  boolean: (value) => value && value !== '0' && value !== 'false' ? true : false,
  integer: (value) => parseInt(value),
  number: (value) => parseFloat(value),
};

function convertParamToJsonSchema(mixed) {
  let type;
  let param;

  if (mixed && typeof mixed === 'object') {
    type = mixed.type?.modifiers?.initial?.toLowerCase();
    param = mixed;
  } else {
    type = mixed;
    param = {};
  }

  const def = SCHEMA_BY_TYPE[type];

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

  if (mixed.field?.defaultValue !== undefined) {
    schema.default = convertParamValueByType(type, mixed.field.defaultValue);
  }

  if (mixed.type?.allowedValues?.length) {
    schema.enum = mixed.type.allowedValues.map((value) => convertParamValueByType(type, value));
  }

  if (mixed.type?.modifiers?.nullable) {
    schema.type = [schema.type, 'null'];
  }

  if (typeof mixed.type?.modifiers?.min === 'number') {
    if (mixed.type?.modifiers?.isNumericRange) {
      schema.minimal = mixed.type.modifiers.min;
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
      required: [],
      properties: {},
    };
  }

  Object.entries(paramGroupVariant).forEach(([propKey, propVariants]) => {
    const oneOf = propVariants.map((propVariant) => {
      const param = paramDescriptors[propVariant.list[0]];

      if (!param || param.type?.modifiers?.undefined) {
        return;
      }

      let paramType = param.type?.modifiers?.initial?.toLowerCase();

      const paramJsonSchema = {
        type: 'object',
        description: param.description && param.description.join('\n'),
        required: [],
        properties: {},
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
          }
          paramJsonSchemaRef = paramJsonSchemaRef.items;
        }
      }

      Object.assign(paramJsonSchemaRef, convertParamToJsonSchema(param));
      paramType = paramJsonSchemaRef.type;

      if (paramType === 'object') {
        convertParamGroupVariantToJsonSchema(propVariant.prop, paramDescriptors, paramJsonSchemaRef);
      }

      return removeEmptyRequiredAndProperties(paramJsonSchema);
    }).filter(_ => _);

    if (oneOf.length === 1) {
      jsonSchema.properties[propKey] = oneOf[0];
    } else {
      const oneOfVariants = [
        ...oneOf.filter((oneOf) => oneOf.type !== 'array'),
        ...oneOf.some((oneOf) => oneOf.type === 'array')
          ? [{
            type: 'array',
            items: { oneOf: oneOf.filter((oneOf) => oneOf.type === 'array').map((oneOf) => oneOf.items) },
          }]
          : []
      ];

      jsonSchema.properties[propKey] = oneOfVariants.length === 1 ? oneOfVariants[0] : { oneOf: oneOfVariants };
    }
  });

  jsonSchema = removeEmptyRequiredAndProperties(jsonSchema);

  return Object.keys(jsonSchema).length === 1 && jsonSchema.type === 'object'
    ? null
    : jsonSchema;
}

// function convertParamsToJsonSchema(params) {
//   const jsonSchema = {
//     type: 'object',
//     required: [],
//     properties: {},
//   };

//   params.forEach((param) => {
//     let nodeProperties = jsonSchema.properties;
//     let nodeRequired = jsonSchema.required;

//     const path = param.field.name.split('.');

//     path.forEach((key, ind) => {
//       const propertyNameAndPropertyAsListIndex = key.match(/^(.+?)(\[\d*])*$/);

//       if (propertyNameAndPropertyAsListIndex) {
//         const [, propertyName, propertyAsListIndex] = propertyNameAndPropertyAsListIndex;

//         if (!(propertyName in nodeProperties)) {
//           if (!param.field.isOptional) {
//             nodeRequired.push(propertyName);
//           }

//           nodeProperties = nodeProperties[propertyName] = {};

//           if (param.field.defaultValue) {
//             nodeProperties.default = param.field.defaultValue;
//           }

//           if (param.description) {
//             nodeProperties.description = param.description.join('\n');
//           }

//           if (propertyAsListIndex) {
//             const arrayElRegex = /\[\d*]/g;

//             while (arrayElRegex.exec(propertyAsListIndex)) {
//               nodeProperties.type = 'array';
//               nodeProperties = nodeProperties.items = {};
//             }
//           } else {
//             if (param.type.modifiers.list) {
//               nodeProperties.type = 'array';
//               nodeProperties = nodeProperties.items = {};
//             }
//           }

//           let paramType = param.type.modifiers.initial.toLowerCase();

//           if (ind < path.length - 1) {
//             nodeProperties.required = [];
//             nodeRequired = nodeProperties.required;
//             nodeProperties.type = 'object';
//             nodeProperties.properties = {};
//             nodeProperties = nodeProperties.properties
//           } else {
//             if (paramType in PARAM_STRING_FORMAT_BY_TYPE) {
//               Object.assign(nodeProperties, convertParamToJsonSchema(paramType));
//               paramType = nodeProperties.type;
//             }

//             if (paramType === 'object') {
//               nodeProperties.required = [];
//               nodeRequired = nodeProperties.required
//               nodeProperties.type = 'object';
//               nodeProperties.properties = {};
//               nodeProperties = nodeProperties.properties
//             } else {
//               if (param.type.allowedValues && param.type.allowedValues.length) {
//                 nodeProperties.enum = PARAM_VALUE_BY_TYPE[paramType]
//                   ? param.type.allowedValues.map((value) => PARAM_VALUE_BY_TYPE[paramType](value))
//                   : param.type.allowedValues;
//               }

//               nodeProperties.type = paramType;
//             }
//           }
//         } else {
//           if (nodeProperties[propertyName].items) {
//             nodeRequired = nodeProperties[propertyName].items.required;
//             nodeProperties = nodeProperties[propertyName].items.properties;
//           } else {
//             nodeRequired = nodeProperties[propertyName].required;
//             nodeProperties = nodeProperties[propertyName].properties;
//           }
//         }
//       }
//     });
//   });

//   return removeEmptyRequiredAndProperties(jsonSchema);
// }

function removeEmptyRequiredAndProperties(jsonSchema) {
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

  if (jsonSchema.oneOf && !jsonSchema.oneOf.length) {
    delete jsonSchema.oneOf;
  }

  if (jsonSchema.properties?.['']) {
    jsonSchema = jsonSchema.properties[''];
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
