function enumChapters(chapters, fn, acc) {
  Object.entries(chapters).forEach(([chapterName, groups]) => {
    Object.entries(groups).forEach(([groupName, subgroups]) => {
      Object.entries(subgroups).forEach(([subgroupName, names]) => {
        Object.entries(names).forEach(([name, versions]) => {
          Object.entries(versions).forEach(([versionName, descriptor]) => {
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

function enumUriPlaceholders(uri, fn) {
  const placeholderRegex = /:(\w+)/g;
  const pathQsIndex = uri.indexOf('?');

  let placeholder;

  while (placeholder = placeholderRegex.exec(pathQsIndex !== -1 ? uri.substr(0, pathQsIndex) : uri)) {
    fn(placeholder[1], false);
  }

  if (pathQsIndex !== -1) {
    while (placeholder = placeholderRegex.exec(uri.substr(pathQsIndex + 1))) {
      fn(placeholder[1], true);
    }
  }
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
      const keyMixed = key.match(/^(.+?)(\[\d*])*$/);

      if (keyMixed) {
        const [, name, list] = keyMixed;

        if (!(name in nodeProperties)) {
          if (!param.field.isOptional) {
            nodeRequired.push(name);
          }

          nodeProperties = nodeProperties[name] = {};

          if (param.description) {
            nodeProperties.description = param.description.join('\n');
          }

          if (list) {
            const arrayElRegex = /\[\d*]/g;

            while (arrayElRegex.exec(list)) {
              nodeProperties.type = 'array';
              nodeProperties = nodeProperties.items = {};
            }
          }

          const type = param.type.name.toLowerCase();

          if (ind < path.length - 1) {
            nodeProperties.required = [];
            nodeRequired = nodeProperties.required
            nodeProperties.type = 'object';
            nodeProperties.properties = {};
            nodeProperties = nodeProperties.properties
          } else if (type === 'boolean' || type === 'number' || type === 'string') {
            nodeProperties.type = param.type.name.toLowerCase();

            if (param.type.allowedValues && param.type.allowedValues.length) {
              nodeProperties.enum = param.type.allowedValues;
            }
          } else {
            nodeProperties.required = [];
            nodeRequired = nodeProperties.required
            nodeProperties.type = 'object';
            nodeProperties.properties = {};
            nodeProperties = nodeProperties.properties
          }
        } else {
          nodeRequired = nodeProperties[keyMixed[1]].required;
          nodeProperties = nodeProperties[keyMixed[1]].items || nodeProperties[keyMixed[1]].properties;
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

module.exports = {
  enumChapters,
  enumUriPlaceholders,
  convertParamsToJsonSchema,
};
