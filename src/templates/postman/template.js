const fs = require('fs');
const parserUtils = require('../../parser.utils');
const URL = require('url').URL;
const { createHash } = require('crypto');
const set = require('lodash.set');
const yaml = require('js-yaml');
const utils = require('../../utils');

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;

    const spec = {
      info: {
        name: params.title,
        description: params.description,
        version: params.version,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
    };
    const rootItems = new Map();

    parserUtils.enumChapters(params.chapters, ({descriptor}) => {
      if (!descriptor.api) {
        return;
      }

      const url = new URL(parserUtils.addUriDefaultScheme(descriptor.api.endpoint, 'apidog', 'apidog'));
      const protocol = url.protocol === 'apidog:' ? 'http' : url.protocol.slice(0, -1);
      const protocolHost = url.host === 'apidog' ? '{{domain}}' : url.host;
      const protocolPath = url.pathname;
      const root = url.protocol === 'apidog:' && url.host === 'apidog'
        ? `${config.server?.[0] ?? protocolHost}${url.port ? ':' + url.port : ''}`
        : `${protocol}://${protocolHost}${url.port ? ':' + url.port : ''}`;

      let rootItem = spec.item;

      if (descriptor.group) {
        if (!rootItems.has(descriptor.group.name)) {
          rootItems.set(descriptor.group.name, {
            name: descriptor.group.title,
            description: descriptor.group.description?.join('\n'),
            item: [],
          });

          spec.item.push(rootItems.get(descriptor.group.name));
        }

        rootItem = rootItems.get(descriptor.group.name).item;
      }

      const item = {
        name: descriptor.title,
        description: descriptor.description?.join('\n'),
        request: {
          method: descriptor.api.transport.method.toUpperCase(),
          url: `${root}${protocolPath}${url.hash}`,
        },
        responses: [],
      };

      rootItem.push(item);

      if (descriptor.authHeaderGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.authHeaderGroupVariant)[0];

        if (groupVariantKey) {
          const authHeader = descriptor.authHeader[descriptor.authHeaderGroup[groupVariantKey].list[0]];
          item.request.auth = {
            type: authHeader.type.modifiers.initial,
            [authHeader.type.modifiers.initial]: [ { key: authHeader.field.name, value: authHeader.type.modifiers.initial, type: 'string' } ],
          };
        }
      }

      if (descriptor.headerGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.headerGroupVariant)[0];

        if (groupVariantKey) {
          const sampleBody = convertParamGroupVariantToSampleBody(
            descriptor.headerGroupVariant[groupVariantKey].prop,
            descriptor.header,
            { primitiveValueAsParam: true },
          );

          item.request.header = Object.entries(sampleBody).map(([ key, value ]) => {
            const description = value instanceof Param ? value.description : undefined;
            value = value instanceof Param ? value.valueOf() : value;

            return {
              key,
              value: value && typeof value === 'object' ? JSON.stringify(value) : value,
              description,
            };
          });
        }
      }

      if (descriptor.paramGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.paramGroupVariant)[0];

        if (groupVariantKey) {
          const contentType = descriptor.contentType[0];
          const sampleBody = convertParamGroupVariantToSampleBody(
            descriptor.paramGroupVariant[groupVariantKey].prop,
            descriptor.param,
            { primitiveValueAsParam: contentType === 'form' || contentType === 'multipart' },
          );

          switch (descriptor.contentType[0]) {
            case 'json':
              item.request.body = {
                mode: 'raw',
                raw: JSON.stringify(sampleBody, undefined, 2),
                options: {
                  raw: {
                    language: 'json',
                  },
                },
              };
              break;
            case 'form':
            case 'multipart':
              item.request.body = {
                mode: 'formdata',
                formdata: Object.entries(sampleBody).map(([ key, value ]) => {
                  const description = value instanceof Param ? value.description : undefined;
                  const type = value instanceof Param ? value.type : 'text';
                  value = value instanceof Param ? value.valueOf() : value;

                  return {
                    key,
                    value: value && typeof value === 'object' ? JSON.stringify(value) : value,
                    description,
                    type,
                  };
                }),
              };
              break;
          }
        }
      }

      if (descriptor.queryGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.queryGroupVariant)[0];

        if (groupVariantKey) {
          const uriParams = {};

          enumUriPlaceholders(protocolPath, (placeholder, isInQuery) => {
            uriParams[placeholder] = isInQuery;
          });

          const sampleBody = convertParamGroupVariantToSampleBody(
            descriptor.queryGroupVariant[groupVariantKey].prop,
            descriptor.query,
            { primitiveValueAsParam: true },
          );

          item.request.url.query = Object.entries(sampleBody).map(([ key, value ]) => {
            if (uriParams[key] === false) {
              return;
            }

            const description = value instanceof Param ? value.description : undefined;
            value = value instanceof Param ? value.valueOf() : value;

            return {
              key,
              value: value && typeof value === 'object' ? JSON.stringify(value) : value,
              description,
            };
          }).filter((e) => !!e);
          item.request.url.variables = Object.entries(sampleBody).map(([ key, value ]) => {
            if (uriParams[key] !== false) {
              return;
            }

            const description = value instanceof Param ? value.description : undefined;
            value = value instanceof Param ? value.valueOf() : value;

            return {
              key,
              value: value && typeof value === 'object' ? JSON.stringify(value) : value,
              description,
            };
          }).filter((e) => !!e);
        }
      }

      if (descriptor.exampleGroup) {
        for (const [ title, example ] of Object.entries(descriptor.exampleGroup)) {
          let i = 0;

          while (true) {
            if (!example.param?.[i] && !example.response?.[i]) {
              break;
            }

            item.responses.push({
              name: example.response?.[i]?.title ?? null,
              body: example.response?.[i]?.description.join('\n') ?? null,
              _postman_previewlanguage: example.response?.[i]?.type ?? 'text',
              originalRequest: {
                url: `${root}${protocolPath}${url.hash}`,
                method: item.request.method,
                auth: item.request.auth,
                headers: item.request.header,
                body: {
                  mode: 'raw',
                  raw: example.param?.[i]?.description.join('\n') ?? null,
                  options: {
                    raw: {
                      language: example.param?.[i]?.type ?? 'text',
                    },
                  },
                },
                description: example.param?.[i]?.title ?? null,
              },
              status: example.response?.[i]?.groupModifiers?.[0] ?? null,
            });

            i += 1;
          }
        }
      }
    });

    const outputFormats = config.outputFormat?.length ? config.outputFormat : [ 'json' ];

    for (const outputFormat of outputFormats) {
      let content;
      let outputName;

      switch (outputFormat) {
        case 'json':
          content = JSON.stringify(spec, undefined, 2);
          outputName = 'postman_collection.json';
          break;
        case 'yaml':
          content = yaml.dump(spec);
          outputName = 'postman_collection.yaml';
          break;  
        default:
          content = outputFormat.replace(/{{content}}/g, content);
          outputName = 'postman_collection.json';

          if (content === outputFormat) {
            throw new Error(`"{{content}}" placeholder expected for custom output format, check "outputFormat" option`);
          }
      }

      if (outputDir === 'stdout') {
        if (outputFormats.length > 1) {
          throw new Error(`Multiple output formats are specified, but target output is a stdout, check "output" option or provide single "outputFormat" option`);
        }

        return content;
      } else {
        if (fs.existsSync(outputDir) && fs.lstatSync(outputDir).isDirectory()) {
          fs.writeFileSync(`${outputDir}/${outputName}`, content);
        } else {
          if (outputFormats.length > 1) {
            throw new Error(`Multiple output formats are specified, but target output is a file, check "output" option or provide single "outputFormat" option`);
          }

          fs.writeFileSync(outputDir, content);
        }
      }
    }
  },
});

const TYPE_TO_DEFAULT_VALUE = {
  boolean: () => true,
  date: (opts) => opts.now.slice(0, 10),
  datetime: (opts) => opts.now,
  'date-time': (opts) => opts.now,
  email: () => 'example@example.com',
  file: () => new ParamFile(),
  hostname: () => 'example.com',
  id: () => 1,
  int32: () => 0,
  int64: () => 0,
  integer: () => 0,
  ipv4: () => '1.2.3.4',
  ipv6: () => '::1',
  latitude: () => 51.477928, // greenwich
  longitude: () => -0.001545, // greenwich
  natural: () => 1,
  negative: () => -0.1,
  negativeinteger: () => -1,
  number: () => 0.1,
  phonenumber: () => '+1234567890',
  positive: () => 0.1,
  positiveinteger: () => 1,
  password: () => 'password123!@#',
  string: () => '',
  time: (opts) => opts.now.slice(11, 19),
  uri: () => 'http://example.com',
  url: () => 'http://example.com',
  uuid: () => '10000000-2345-0000-6789-000000000000',
}

class Param {
  get type() {
    return null;
  }

  constructor(value, description) {
    this.description = description;
    this.value = value;
  }

  toJSON() {
    return this.valueOf();
  }

  valueOf() {
    return this.value;
  }
}

class ParamFile extends Param {
  get type() {
    return 'file';
  }

  valueOf() {
    return this.value ?? './example.txt';
  }
}

function convertParamGroupVariantToSampleBody(paramGroupVariant, paramDescriptors, opts, path, sample) {
  if (!sample) {
    sample = {};
  }

  if (!opts?.now) {
    opts = { ...opts, now: new Date().toISOString() };
  }

  Object.entries(paramGroupVariant).forEach(([ propKey, propVariants ]) => {
    const param = paramDescriptors[propVariants[0].list[0]];

    if (!param || param.type?.modifiers?.undefined) {
      return;
    }

    let paramPath = path ? `${path}.${propKey}` : propKey;

    if (param.type?.modifiers?.list) {
      paramPath += '[0]'.repeat(param.type.modifiers.list);
    }

    let paramValue = param.field.defaultValue !== undefined
      ? param.field.defaultValue
      : param.type?.allowedValues?.[0] ?? TYPE_TO_DEFAULT_VALUE[param.type?.modifiers?.initial]?.(opts) ?? null;

    if (opts?.primitiveValueAsParam && !param.type?.modifiers?.object && !(paramValue instanceof Param)) {
      paramValue = new Param(String(paramValue), param.description?.join('\n').trim());
    }

    set(sample, paramPath, paramValue);
    convertParamGroupVariantToSampleBody(propVariants[0].prop, paramDescriptors, opts, paramPath, sample);
  });

  if (Object.keys(sample).length === 1 && sample[utils.root]) {
    sample = sample[utils.root];
  }

  return sample;
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
