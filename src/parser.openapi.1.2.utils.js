const fs = require('fs');
const get = require('lodash.get');
const Ajv = require('ajv-draft-04');
const addFormats = require('ajv-formats');
const { Block } = require('./block');
const parserJsonschemaUtils = require('./parser.jsonschema.utils');

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(JSON.parse(fs.readFileSync('./src/assets/json-schema.3.0.json', 'utf8')));

function convert(spec, config) {
  const blocks = [];

  if (!validate(spec)) {
    throwError(validate.errors[0]);
  }

  if (spec.info && config) {
    if (!config.title) {
      config.title = spec.info.title;
    }

    if (!config.version) {
      config.version = spec.info.version;
    }
  }

  const usedVisualIds = new Set();

  Object.entries(spec.paths).forEach(([ path, pathSpec ]) => {
    Object.entries(pathSpec).forEach(([ method, methodSpec ]) => {
      const block = new Block();

      block.api = {
        endpoint: path.replace(/\{(\w+)}/g, (_, param) => `:${param}`),
        title: methodSpec.summary,
        transport: { name: 'http', method },
      };

      if (usedVisualIds.has(methodSpec.operationId)) {
        // TODO warn
      } else {
        block.visualId = methodSpec.operationId;
      }

      if (methodSpec.parameters?.length) {
        methodSpec.parameters.forEach((paramSpec) => {
          const params = parserJsonschemaUtils.convert({
            type: 'object',
            require: paramSpec.required ? [ paramSpec.name ] : [],
            description: paramSpec.description,
            properties: { [paramSpec.name]: paramSpec.schema },
          });

          if (paramSpec.in === 'query') {
            block.query = params;
          } else {
            block.param = params;
          }
        });
      }

      if (methodSpec.responses) {
        const success = [];
        const error = [];

        Object.entries(methodSpec.responses).forEach(([ responseCode, responseSpec ]) => {
          if (responseCode[0] === '2' || responseCode.slice(0, 3).toLowerCase() === 'x-2') {

          }
        });
      }

      blocks.push(block);
    });
  });

  return blocks;
}

// function resolveApi(spec, api, docBlocks, operations) {
//   if (!docBlocks) {
//     docBlocks = [];
//   }

//   for (const operation of operations || api.operations) {
//     const docBlock = [];

//     let apiUri = api.path.replace(/\{(\w+)}/g, (_, param) => `:${param}`);

//     docBlock.push(`@api {${operation.method.toLowerCase()}} ${apiUri} ${operation.summary || ''}`);

//     if (spec.apiVersion) {
//       docBlock.push(`@apiVersion ${spec.apiVersion}`);
//     }

//     if (operation.deprecated) {
//       docBlock.push(`@apiDeprecated`);
//     }

//     // if (operation.nickname) {
//     //   docBlock.push(`@apiName ${operation.nickname}`);
//     // }

//     if (operation.notes) {
//       docBlock.push(`@apiDescription ${operation.notes}`);
//     }

//     for (const parameter of operation.parameters) {
//       switch (parameter.paramType) {
//         case 'body':
//           resolveModelByType(spec, '@apiParam', parameter.type, '', docBlock);

//           break;

//         case 'header':
//           docBlock.push(`@apiHeader {${resolveType(parameter.type, parameter.format)}} ${parameter.required ? '' : '['}${parameter.name}${parameter.required ? '' : ']'} ${parameter.description || ''}`);

//           break;

//         case 'form':
//         case 'path':
//         case 'query':
//           docBlock.push(`@apiParam {${resolveType(parameter.type, parameter.format)}} ${parameter.name} ${parameter.description || ''}`);

//           break;

//         default:
//           throwError();
//       }
//     }

//     docBlocks.push(docBlock);
//   }

//   return docBlocks;
// }

// function resolveApiOperation(spec, operation, docBlock) {
//   if (!docBlock) {
//     docBlock = [];
//   }

//   return docBlock;
// }

// function resolveModel(spec, annotation, model, prefix, docBlock) {
//   if (!docBlock) {
//     docBlock = [];
//   }

//   if (!prefix) {
//     prefix = '';
//   }

//   validateModel(spec, model);

//   Object.entries(model.properties).forEach(([key, val]) => {
//     const isRequired = val.required || (model.required && model.required.indexOf(key) !== -1);

//     docBlock.push(`${annotation} {${resolveType(val.type, val.format)}} ${isRequired ? '' : '['}${prefix}${key}${isRequired ? '' : ']'} ${val.description || ''}`);
//   });

//   return docBlock;
// }

// function resolveModelByType(spec, annotation, type, prefix, docBlock) {
//   if (!docBlock) {
//     docBlock = [];
//   }

//   if (!prefix) {
//     prefix = '';
//   }

//   validateModelByType(spec, type);

//   if (type in spec.models) {
//     return resolveModel(spec, annotation, spec.models[type], prefix, docBlock);
//   }

//   throwError(`Model "${type}" is not defined`);
// }

// function resolveType(type, format) {
//   switch (type) {
//     case 'boolean':
//       return 'Boolean';

//     case 'integer':
//       return 'Integer';

//     case 'string':
//       return format === 'date-time' ? 'Date' : 'String';
//   }

//   return 'String';
// }

function throwError(message) {
  throw new Error(`Malformed OpenAPI specification${message ? `: ${message}` : ''}`);
}

// function validate(spec) {
//   if (!spec || typeof spec !== 'object') {
//     throwError();
//   }

//   if (typeof spec.openapi !== 'string' || !spec.openapi[0] === '3') {
//     throwError();
//   }

//   if (typeof spec.info?.version) {
//     throwError();
//   }

//   if (!spec.paths || typeof spec.paths !== 'object') {
//     throwError();
//   }

//   Object.values(spec.paths).forEach((pathSpec) => validateApi(spec, pathSpec));

//   if (spec.componens && typeof spec.components) {
//     if (!spec.models || typeof spec.models !== 'object') {
//       throwError();
//     }

//     Object.values(spec.models).forEach((model) => validateModel(spec, model));
//   }

//   return spec;
// }

// function validateApi(spec, api) {
//   if (!api || typeof api !== 'object') {
//     throwError();
//   }

//   if (typeof api.path !== 'string') {
//     throwError();
//   }

//   if (!Array.isArray(api.operations)) {
//     throwError();
//   }

//   for (const operation of api.operations) {
//     if (typeof operation.method !== 'string') {
//       throwError();
//     }

//     if (operation.nickname && typeof operation.nickname !== 'string') {
//       throwError();
//     }

//     if (typeof operation.notes !== 'string') {
//       throwError();
//     }

//     if (operation.summary && typeof operation.summary !== 'string') {
//       throwError();
//     }

//     if (!Array.isArray(operation.parameters)) {
//       throwError();
//     }

//     for (const parameter of operation.parameters) {
//       if (!parameter || typeof parameter !== 'object') {
//         throwError();
//       }

//       if (parameter.description && typeof parameter.description !== 'string') {
//         throwError();
//       }

//       if (typeof parameter.name !== 'string') {
//         throwError();
//       }

//       if (typeof parameter.paramType !== 'string') {
//         throwError();
//       }

//       if (parameter.required && typeof parameter.required !== 'boolean') {
//         throwError();
//       }

//       if (parameter.type && typeof parameter.type !== 'string') {
//         throwError();
//       }
//     }
//   }

//   return api;
// }

// function validateModel(spec, model) {
//   if (!model || typeof model !== 'object') {
//     throwError();
//   }

//   if (!model.properties || typeof model.properties !== 'object') {
//     throwError();
//   }

//   if (model.required && !Array.isArray(model.required)) {
//     throwError();
//   }

//   Object.entries(model.properties).forEach(([key, val]) => {
//     if (!val || typeof val !== 'object') {
//       throwError();
//     }

//     if (val.description && typeof val.description !== 'string') {
//       throwError();
//     }

//     if (val.enum && !Array.isArray(val.enum)) {
//       throwError();
//     }

//     if (val.enum) {
//       for (const e of val.enum) {
//         if (typeof e !== 'string') {
//           throwError();
//         }
//       }
//     }
//   });

//   return model;
// }

// function validateModelByType(spec, type) {
//   if (!spec.models || typeof spec.models !== 'object') {
//     throwError();
//   }

//   return validateModel(spec, spec.models[type]);
// }

function enumUriPlaceholders(uri, fn, acc) {
  const placeholderRegex = /(\{|\%7B)(\w+)(\}|\%7D)/g;
  const pathQsIndex = uri.indexOf('?');

  let placeholder;

  while (placeholder = placeholderRegex.exec(pathQsIndex !== -1 ? uri.substr(0, pathQsIndex) : uri)) {
    fn(placeholder[2], false, acc);
  }

  if (pathQsIndex !== -1) {
    while (placeholder = placeholderRegex.exec(uri.substr(pathQsIndex + 1))) {
      fn(placeholder[2], true, acc);
    }
  }

  return acc;
}

const CURR_RESOLVING_PATHS = new Set();

function normalizeRefs(spec, root) {
  if (!root) {
    root = spec;
  }

  if (spec && typeof spec === 'object' && typeof spec.$ref === 'string' && Object.keys(spec) === 1) {
    const $ref = spec.$ref;

    if (CURR_RESOLVING_PATHS.has($ref)) {
      CURR_RESOLVING_PATHS.clear();

      throw new Error('Circular reference');
    }

    CURR_RESOLVING_PATHS.add($ref);
    spec = get(root, $ref.slice(2).replace(/\//g, '.'));
    CURR_RESOLVING_PATHS.delete($ref);
  }

  if (Array.isArray(spec)) {
    spec.forEach((val, i) => {
      if (val && typeof val === 'object' && typeof val.$ref === 'string' && Object.keys(val).length === 1) {
        const $ref = val.$ref;

        if (CURR_RESOLVING_PATHS.has($ref)) {
          CURR_RESOLVING_PATHS.clear();

          throw new Error('Circular reference');
        }

        CURR_RESOLVING_PATHS.add($ref);
        spec[i] = val = get(root, $ref.slice(2).replace(/\//g, '.'));
        CURR_RESOLVING_PATHS.delete($ref);
      }

      spec[i] = normalizeRefs(val, root);
    });
  } else if (spec && typeof spec === 'object') {
    Object.entries(spec).forEach(([ key, val ]) => {
      if (val && typeof val === 'object' && typeof val.$ref === 'string' && Object.keys(val).length === 1) {
        const $ref = val.$ref;

        if (CURR_RESOLVING_PATHS.has($ref)) {
          CURR_RESOLVING_PATHS.clear();

          throw new Error('Circular reference');
        }

        CURR_RESOLVING_PATHS.add($ref);
        val = get(root, $ref.slice(2).replace(/\//g, '.'));
        CURR_RESOLVING_PATHS.delete($ref);
      }
      
      spec[key] = normalizeRefs(val, root);
    });
  }

  return spec;
}

module.exports = {
  convert,
  enumUriPlaceholders,
  fetchSource: (source) => {
    if (source.slice(-5).toLowerCase() === '.json') {
      return normalizeRefs(JSON.parse(fs.readFileSync(source, 'utf8')));
    }

    throw new Error(`Unknown OpenAPI source format "${source}"`);
  },
  // resolveApi,
  // resolveApiOperation,
  // resolveModel,
  // resolveModelByType,
  // resolveType,
  // validate,
  // validateApi,
  // validateModel,
  // validateModelByType,
};

const c = {};
const q = convert(module.exports.fetchSource('./spec/sample/openapi.json'), c);
console.log(JSON.stringify(q, undefined, 2), c)