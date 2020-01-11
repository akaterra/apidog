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
          // } else if (type === 'boolean' || type === 'null' || type === 'number' || type === 'string') {
          //   nodeProperties.type = type;

          //   if (param.type.allowedValues && param.type.allowedValues.length) {
          //     nodeProperties.enum = param.type.allowedValues;
          //   }
          // } else if (type === 'date' || type === 'datetime' || type === 'file' || type === 'uuid') {
          //   nodeProperties.type = 'string';

          //   if (param.type.allowedValues && param.type.allowedValues.length) {
          //     nodeProperties.enum = param.type.allowedValues;
          //   }
          } else {
            if (type in paramTypeToFormat) {
              nodeProperties.format = paramTypeToFormat[type] !== true
                ? paramTypeToFormat[type]
                : type;

              type = 'string';
            }

            if (type === 'boolean' || type === 'null' || type === 'number' || type === 'string') {
              if (param.type.allowedValues && param.type.allowedValues.length) {
                nodeProperties.enum = param.type.allowedValues;
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
  convertParamsToJsonSchema,
};
