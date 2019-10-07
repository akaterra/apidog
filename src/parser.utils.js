function paramsToJsonSchema(params) {
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
      const keyLists = key.match(/^(\w+)(\[.*])*$/);

      if (keyLists) {
        if (!(keyLists[1] in nodeProperties)) {
          if (!param.field.isOptional) {
            nodeRequired.push(keyLists[1]);
          }

          nodeProperties = nodeProperties[keyLists[1]] = {};

          if (keyLists[2]) {
            const arrayElRegex = /\[.*]/g;

            while (arrayElRegex.exec(keyLists[2])) {
              nodeProperties.type = 'array';
              nodeProperties = nodeProperties.items = {};
            }
          }

          const type = param.type.name.toLowerCase();

          if (type === 'object' || ind < path.length - 1) {
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
          }
        } else {
          nodeRequired = nodeProperties[keyLists[1]].required;
          nodeProperties = nodeProperties[keyLists[1]].items || nodeProperties[keyLists[1]].properties;
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
  paramsToJsonSchema: paramsToJsonSchema,
};
