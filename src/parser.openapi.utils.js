const fs = require('fs');
const get = require('lodash.get');
const Ajv = require('ajv-draft-04');
const addFormats = require('ajv-formats');
const { Block } = require('./block');
const parserJsonschemaUtils = require('./parser.jsonschema.utils');

const ajv = new Ajv();
addFormats(ajv);
const validate = ajv.compile(JSON.parse(fs.readFileSync(__dirname + '/assets/json-schema.3.0.json', 'utf8')));

function convert(spec, definitions, config) {
  if (!definitions) {
    definitions = {};
  }

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

    if (spec.info.description) {

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
      block.authHeader = [];
      block.authHeaderGroup = {};
      block.authQuery = [];
      block.authQueryGroup = {};
      block.authParam = [];
      block.authParamGroup = {};
      block.header = [];
      block.headerGroup = {};
      block.query = [];
      block.queryGroup = {};
      block.param = [];
      block.paramGroup = {};
      block.success = [];
      block.successGroup = {};
      block.error = [];
      block.errorGroup = {};
      block.version = spec.info?.version;

      if (usedVisualIds.has(methodSpec.operationId)) {
        // TODO warn
      } else {
        block.visualId = methodSpec.operationId;
      }

      if (methodSpec.parameters?.length) {
        methodSpec.parameters.forEach((paramSpec) => {
          let addTo;
          let addToGroup;

          if (paramSpec.in === 'header') {
            addTo = block.header;
            addToGroup = block.headerGroup;
          } else if (paramSpec.in === 'query') {
            addTo = block.query;
            addToGroup = block.queryGroup;
          } else {
            addTo = block.param;
            addToGroup = block.paramGroup;
          }

          const params = parserJsonschemaUtils.convert({
            type: 'object',
            require: paramSpec.required ? [ paramSpec.name ] : [],
            description: paramSpec.description,
            properties: { [paramSpec.name]: paramSpec.schema },
          }, null, addToGroup);

          addTo.push(...params);
        });
      }

      if (methodSpec.requestBody?.content) {
        Object.entries(methodSpec.requestBody.content).forEach(([ contentType, requestBodySpec ]) => {
          const params = parserJsonschemaUtils.convert(requestBodySpec.schema, contentType, block.paramGroup);

          block.param.push(...params);
        });
      }

      if (methodSpec.responses) {
        Object.entries(methodSpec.responses).forEach(([ responseCode, responseSpec ]) => {
          if (!responseSpec.content) {
            return;
          }

          if (
            responseCode[0] === '2' ||
            responseCode.toLowerCase().startsWith('x-2') ||
            responseCode[0] === '3' ||
            responseCode.toLowerCase().startsWith('x-3')
          ) {
            for (const { schema } of Object.values(responseSpec.content)) {
              const params = parserJsonschemaUtils.convert(schema, responseCode, block.successGroup);

              block.success.push(...params);
            }
          } else {
            for (const { schema } of Object.values(responseSpec.content)) {
              const params = parserJsonschemaUtils.convert(schema, responseCode, block.errorGroup);

              block.error.push(...params);
            }
          }
        });
      }

      if (methodSpec.tags?.length) {
        block.group = methodSpec.tags[0];

        const specTag = spec.tags?.find((tag) => tag.name === block.group);

        if (specTag) {
          definitions[block.group] = definitions[block.group] ?? new Block();

          definitions[block.group].define = {
            name: block.group,
            title: specTag.name,
            description: specTag.description,
          };
        }
      }

      blocks.push(block);
    });
  });

  return { blocks, definitions };
}

function throwError(message) {
  throw new Error(`Malformed OpenAPI specification${message ? `: ${message}` : ''}`);
}

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
        spec[key] = val = get(root, $ref.slice(2).replace(/\//g, '.'));
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
};
