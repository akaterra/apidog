const fs = require('fs');

function convert(spec) {
  const docBlocks = [];

  validate(spec);

  for (const api of spec.apis) {
    resolveApi(spec, api, docBlocks);
  }

  return docBlocks;
}

function resolveApi(spec, api, docBlocks, operations) {
  if (!docBlocks) {
    docBlocks = [];
  }

  for (const operation of operations || api.operations) {
    const docBlock = [];

    let apiUri = api.path.replace(/\{(\w+)}/g, (_, param) => `:${param}`);

    docBlock.push(`@api {${operation.method.toLowerCase()}} ${apiUri} ${operation.summary || ''}`);

    if (spec.apiVersion) {
      docBlock.push(`@apiVersion ${spec.apiVersion}`);
    }

    if (operation.deprecated) {
      docBlock.push(`@apiDeprecated`);
    }

    // if (operation.nickname) {
    //   docBlock.push(`@apiName ${operation.nickname}`);
    // }

    if (operation.notes) {
      docBlock.push(`@apiDescription ${operation.notes}`);
    }

    for (const parameter of operation.parameters) {
      switch (parameter.paramType) {
        case 'body':
          resolveModelByType(spec, '@apiParam', parameter.type, '', docBlock);

          break;

        case 'header':
          docBlock.push(`@apiHeader {${resolveType(parameter.type, parameter.format)}} ${parameter.required ? '' : '['}${parameter.name}${parameter.required ? '' : ']'} ${parameter.description || ''}`);

          break;

        case 'form':
        case 'path':
        case 'query':
          docBlock.push(`@apiParam {${resolveType(parameter.type, parameter.format)}} ${parameter.name} ${parameter.description || ''}`);

          break;

        default:
          throwError();
      }
    }

    docBlocks.push(docBlock);
  }

  return docBlocks;
}

function resolveApiOperation(spec, operation, docBlock) {
  if (!docBlock) {
    docBlock = [];
  }

  return docBlock;
}

function resolveModel(spec, token, model, prefix, docBlock) {
  if (!docBlock) {
    docBlock = [];
  }

  if (!prefix) {
    prefix = '';
  }

  validateModel(spec, model);

  Object.entries(model.properties).forEach(([key, val]) => {
    const isRequired = val.required || (model.required && model.required.indexOf(key) !== -1);

    docBlock.push(`${token} {${resolveType(val.type, val.format)}} ${isRequired ? '' : '['}${prefix}${key}${isRequired ? '' : ']'} ${val.description || ''}`);
  });

  return docBlock;
}

function resolveModelByType(spec, token, type, prefix, docBlock) {
  if (!docBlock) {
    docBlock = [];
  }

  if (!prefix) {
    prefix = '';
  }

  validateModelByType(spec, type);

  if (type in spec.models) {
    return resolveModel(spec, token, spec.models[type], prefix, docBlock);
  }

  throwError(`Model "${type}" is not defined`);
}

function resolveType(type, format) {
  switch (type) {
    case 'boolean':
      return 'Boolean';

    case 'integer':
      return 'Number';

    case 'string':
      return format === 'date-time' ? 'Date' : 'String';
  }

  return 'String';
}

function throwError(message) {
  throw new Error(`Malformed Swagger specification${message ? `: ${message}` : ''}`);
}

function validate(spec) {
  if (!spec || typeof spec !== 'object') {
    throwError();
  }

  if (!spec.apis || !Array.isArray(spec.apis)) {
    throwError();
  }

  if (spec.apiVersion && typeof spec.apiVersion !== 'string') {
    throwError();
  }

  if (!spec.basePath || typeof spec.basePath !== 'string') {
    throwError();
  }

  if (!spec.resourcePath && typeof spec.basePath !== 'string') {
    throwError();
  }

  for (const api of spec.apis) {
    validateApi(spec, api);
  }

  if (spec.models) {
    if (!spec.models || typeof spec.models !== 'object') {
      throwError();
    }

    Object.values(spec.models).forEach((model) => validateModel(spec, model));
  }

  return spec;
}

function validateApi(spec, api) {
  if (!api || typeof api !== 'object') {
    throwError();
  }

  if (typeof api.path !== 'string') {
    throwError();
  }

  if (!Array.isArray(api.operations)) {
    throwError();
  }

  for (const operation of api.operations) {
    if (typeof operation.method !== 'string') {
      throwError();
    }

    if (operation.nickname && typeof operation.nickname !== 'string') {
      throwError();
    }

    if (typeof operation.notes !== 'string') {
      throwError();
    }

    if (operation.summary && typeof operation.summary !== 'string') {
      throwError();
    }

    if (!Array.isArray(operation.parameters)) {
      throwError();
    }

    for (const parameter of operation.parameters) {
      if (!parameter || typeof parameter !== 'object') {
        throwError();
      }

      if (parameter.description && typeof parameter.description !== 'string') {
        throwError();
      }

      if (typeof parameter.name !== 'string') {
        throwError();
      }

      if (typeof parameter.paramType !== 'string') {
        throwError();
      }

      if (parameter.required && typeof parameter.required !== 'boolean') {
        throwError();
      }

      if (parameter.type && typeof parameter.type !== 'string') {
        throwError();
      }
    }
  }

  return api;
}

function validateModel(spec, model) {
  if (!model || typeof model !== 'object') {
    throwError();
  }

  if (!model.properties || typeof model.properties !== 'object') {
    throwError();
  }

  if (model.required && !Array.isArray(model.required)) {
    throwError();
  }

  Object.entries(model.properties).forEach(([key, val]) => {
    if (!val || typeof val !== 'object') {
      throwError();
    }

    if (val.description && typeof val.description !== 'string') {
      throwError();
    }

    if (val.enum && !Array.isArray(val.enum)) {
      throwError();
    }

    if (val.enum) {
      for (const e of val.enum) {
        if (typeof e !== 'string') {
          throwError();
        }
      }
    }
  });

  return model;
}

function validateModelByType(spec, type) {
  if (!spec.models || typeof spec.models !== 'object') {
    throwError();
  }

  return validateModel(spec, spec.models[type]);
}

function enumUriPlaceholders(uri, fn) {
  const placeholderRegex = /(\{|\%7B)(\w+)(\}|\%7D)/g;
  const pathQsIndex = uri.indexOf('?');

  let placeholder;

  while (placeholder = placeholderRegex.exec(pathQsIndex !== -1 ? uri.substr(0, pathQsIndex) : uri)) {
    fn(placeholder[2], false);
  }

  if (pathQsIndex !== -1) {
    while (placeholder = placeholderRegex.exec(uri.substr(pathQsIndex + 1))) {
      fn(placeholder[2], true);
    }
  }
}

module.exports = {
  convert,
  enumUriPlaceholders,
  fetchSource: (source) => {
    if (source.slice(-5).toLowerCase() === '.json') {
      return JSON.parse(fs.readFileSync(source, 'utf8'));
    }

    throw new Error(`Unknown Swagger source format "${source}"`);
  },
  resolveApi,
  resolveApiOperation,
  resolveModel,
  resolveModelByType,
  resolveType,
  validate,
  validateApi,
  validateModel,
  validateModelByType,
};
