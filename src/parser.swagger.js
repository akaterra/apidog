const fs = require('fs');
const parseBlockLines = require('./parser.block_lines');
const utils = require('./utils');

function parseSwaggerFile(file, logger) {
  if (!logger) {
    logger = new utils.Logger();
  }

  if (file.slice(-5).toLowerCase() === '.json') {
    return parseSwagger(JSON.parse(fs.readFileSync(file, 'utf8'))).map((lines) => {
      return parseBlockLines.parseBlockLines(lines, undefined, logger);
    });
  }

  throw new Error(`Unknown Swagger file format "${file}"`);
}

function parseSwagger(spec) {
  const docBlocks = [];

  if (!spec || typeof spec !== 'object') {
    throwError();
  }

  if (!spec.apis || !Array.isArray(spec.apis)) {
    throwError();
  }

  for (const api of spec.apis) {
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
      const docBlock = [];

      if (typeof operation.method !== 'string') {
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

      let apiUri = api.path.replace(/\{(\w+)}/g, (_, param) => `:${param}`);

      // if (apiUri.lastIndexOf('?') === -1) {
      //   apiUri += '?';
      // }
      //
      docBlock.push(`@api {${operation.method.toLowerCase()}} ${apiUri} ${operation.summary || ''}`);

      if (operation.notes) {
        docBlock.push(`@apiDescription ${operation.notes}`);
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

        switch (parameter.paramType) {
          case 'body':
            resolveBodyModel(spec, '@apiParam', parameter.type, '', docBlock);

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
  }


  return docBlocks;
}

function resolveBodyModel(spec, token, type, prefix, docBlock) {
  if (!docBlock) {
    docBlock = [];
  }

  if (!prefix) {
    prefix = '';
  }

  if (!spec.models || typeof spec.models !== 'object') {
    throwError();
  }

  if (type in spec.models) {
    const model = spec.models[type];

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

      const isRequired = val.required || (model.required && model.required.indexOf(key) !== -1);

      docBlock.push(`${token} {${resolveType(val.type, val.format)}} ${isRequired ? '' : '['}${prefix}${key}${isRequired ? '' : ']'} ${val.description || ''}`);
    });

    return docBlock;
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

module.exports = {
  normalizeDir(dir) {
    return dir.substr(0, dir.lastIndexOf('/'));
  },
  parseSwaggerFile,
};
