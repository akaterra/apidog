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

const paramTypeToFormat = {
  date: true,
  datetime: 'date-time',
  'date-time': true,
  email: true,
  hostname: true,
  ipv4: true,
  ipv6: true,
  time: true,
  uri: true,
  uuid: true,
};

function convertParamTypeToJsonSchema(type) {
  return {
    type: type in paramTypeToFormat
      ? paramTypeToFormat[type] === true
        ? 'string'
        : paramTypeToFormat[type]
      : type,
    format: type in paramTypeToFormat
      ? paramTypeToFormat[type] === true
        ? type
        : paramTypeToFormat[type]
      : undefined,
  };
}

const PARAM_VALUE_BY_TYPE = {
  'Boolean': (value) => value && value !== '0' && value !== 'false' ? true : false,
  'Boolean:Enum': (value) => value && value !== '0' && value !== 'false' ? true : false,
  'Number': (value) => parseFloat(value),
  'Number:Enum': (value) => parseFloat(value),
};

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

      if (!param) {
        return;
      }

      const paramJsonSchema = {
        type: 'object',
        required: [],
        properties: {},
      };

      if (!param.field.isOptional && !jsonSchema.required.includes(propKey)) {
        jsonSchema.required.push(propKey);
      }

      let paramJsonSchemaRef = paramJsonSchema;

      if (param.type.modifiers.list) {
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

      let paramType = param.type.modifiers.initial.toLowerCase();

      if (paramType in paramTypeToFormat) {
        paramJsonSchemaRef.format = paramTypeToFormat[paramType] !== true
          ? paramTypeToFormat[paramType]
          : paramType;

        paramType = 'string';
      }

      if (paramType === 'boolean' || paramType === 'null' || paramType === 'number' || paramType === 'string') {
        if (param.type.allowedValues && param.type.allowedValues.length) {
          paramJsonSchemaRef.enum = PARAM_VALUE_BY_TYPE[param.type.name]
            ? param.type.allowedValues.map((value) => PARAM_VALUE_BY_TYPE[param.type.name](value))
            : param.type.allowedValues;
        }

        paramJsonSchemaRef.type = param.type.modifiers.nullable ? [paramType, null]  : paramType;
      } else {
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

  return removeEmptyRequiredAndProperties(jsonSchema);
}

function convertParamsToJsonSchema(params) {
  const jsonSchema = {
    type: 'object',
    required: [],
    properties: {},
  };

  params.forEach((param) => {
    let nodeProperties = jsonSchema.properties;
    let nodeRequired = jsonSchema.required;

    const path = param.field.name.split('.');

    path.forEach((key, ind) => {
      const propertyNameAndPropertyAsListIndex = key.match(/^(.+?)(\[\d*])*$/);

      if (propertyNameAndPropertyAsListIndex) {
        const [, propertyName, propertyAsListIndex] = propertyNameAndPropertyAsListIndex;

        if (!(propertyName in nodeProperties)) {
          if (!param.field.isOptional) {
            nodeRequired.push(propertyName);
          }

          nodeProperties = nodeProperties[propertyName] = {};

          if (param.description) {
            nodeProperties.description = param.description.join('\n');
          }

          if (propertyAsListIndex) {
            const arrayElRegex = /\[\d*]/g;

            while (arrayElRegex.exec(propertyAsListIndex)) {
              nodeProperties.type = 'array';
              nodeProperties = nodeProperties.items = {};
            }
          } else {
            if (param.type.modifiers.list) {
              nodeProperties.type = 'array';
              nodeProperties = nodeProperties.items = {};
            }
          }

          let type = param.type.modifiers.initial.toLowerCase();

          if (ind < path.length - 1) {
            nodeProperties.required = [];
            nodeRequired = nodeProperties.required;
            nodeProperties.type = 'object';
            nodeProperties.properties = {};
            nodeProperties = nodeProperties.properties
          } else {
            if (type in paramTypeToFormat) {
              nodeProperties.format = paramTypeToFormat[type] !== true
                ? paramTypeToFormat[type]
                : type;

              type = 'string';
            }

            if (type === 'boolean' || type === 'null' || type === 'number' || type === 'string') {
              if (param.type.allowedValues && param.type.allowedValues.length) {
                nodeProperties.enum = PARAM_VALUE_BY_TYPE[param.type.name]
                  ? param.type.allowedValues.map((value) => PARAM_VALUE_BY_TYPE[param.type.name](value))
                  : param.type.allowedValues;
              }

              nodeProperties.type = type;
            } else {
              nodeProperties.required = [];
              nodeRequired = nodeProperties.required
              nodeProperties.type = 'object';
              nodeProperties.properties = {};
              nodeProperties = nodeProperties.properties
            }
          }
        } else {
          if (nodeProperties[propertyName].items) {
            nodeRequired = nodeProperties[propertyName].items.required;
            nodeProperties = nodeProperties[propertyName].items.properties;
          } else {
            nodeRequired = nodeProperties[propertyName].required;
            nodeProperties = nodeProperties[propertyName].properties;
          }
        }
      }
    });
  });

  return removeEmptyRequiredAndProperties(jsonSchema);
}

function removeEmptyRequiredAndProperties(jsonSchema) {
  if (jsonSchema.properties) {
    Object.values(jsonSchema.properties).forEach(removeEmptyRequiredAndProperties);
  }

  if (jsonSchema.items) {
    removeEmptyRequiredAndProperties(jsonSchema.items);
  }

  if (jsonSchema.required && jsonSchema.required.length === 0) {
    delete jsonSchema.required;
  }

  if (jsonSchema.properties && Object.keys(jsonSchema.properties).length === 0) {
    delete jsonSchema.properties;
  }

  return jsonSchema;
}

function addUriDefaultScheme(uri) {
  if (!/^\w+:\/\//.test(uri)) {
    return `scheme://domain${uri[0] === '/' ? '' : '/'}${uri}`;
  }

  return uri;
}

module.exports = {
  addUriDefaultScheme,
  enumChapters,
  enumChaptersApis,
  enumChaptersNotes,
  enumUriPlaceholders,
  convertParamGroupVariantToJsonSchema,
  convertParamsToJsonSchema,
  convertParamTypeToJsonSchema,
};
