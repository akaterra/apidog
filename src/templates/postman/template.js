const fs = require('fs');
const parserUtils = require('../../parser.utils');
const URL = require('url').URL;
const { createHash } = require('crypto');
const defaults = require('lodash.defaultsdeep');
const yaml = require('js-yaml');
const utils = require('../../utils');

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;
    const opts = {
      defaultCurrencyValue: config.defaultCurrencyValue,
      defaultEmailValue: config.defaultEmailValue,
      defaultHostnameValue: config.defaultHostnameValue,
      defaultPhoneNumberValue: config.defaultPhoneNumberValue,
      defaultPasswordValue: config.defaultPasswordValue,
      defaultSecretKeyValue: config.defaultSecretKeyValue,
      defaultUriValue: config.defaultUriValue,
      defaultUrlValue: config.defaultUrlValue,
    };

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
          const sampleBody = utils.convertParamGroupVariantToSampleBody(
            descriptor.headerGroupVariant[groupVariantKey].prop,
            descriptor.header,
            { primitiveValueAsParam: true },
          );

          item.request.header = Object.entries(sampleBody).map(([ key, value ]) => {
            const description = value instanceof utils.Param ? value.description : undefined;
            value = value instanceof utils.Param ? value.valueOf() : value;

            return {
              key,
              value: value && typeof value === 'object' ? JSON.stringify(value) : value,
              description,
            };
          });
        }
      }

      let requestSampleBody;

      if (descriptor.paramGroupVariant) {
        const groupVariant = Object.values(descriptor.paramGroupVariant)[0];

        if (groupVariant) {
          const contentType = descriptor.contentType[0];
          const sampleBody = requestSampleBody = utils.convertParamGroupVariantToSampleBody(
            groupVariant.prop,
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
                  const description = value instanceof utils.Param ? value.description : undefined;
                  const type = value instanceof utils.Param ? value.type : 'text';
                  value = value instanceof utils.Param ? value.valueOf() : value;

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
        const groupVariant = Object.values(descriptor.queryGroupVariant)[0];

        if (groupVariant) {
          const uriParams = {};

          enumUriPlaceholders(protocolPath, (placeholder, isInQuery) => {
            uriParams[placeholder] = isInQuery;
          });

          const sampleBody = utils.convertParamGroupVariantToSampleBody(
            groupVariant.prop,
            descriptor.query,
            { primitiveValueAsParam: true },
          );

          item.request.url.query = Object.entries(sampleBody).map(([ key, value ]) => {
            if (uriParams[key] === false) {
              return;
            }

            const description = value instanceof utils.Param ? value.description : undefined;
            value = value instanceof utils.Param ? value.valueOf() : value;

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

            const description = value instanceof utils.Param ? value.description : undefined;
            value = value instanceof utils.Param ? value.valueOf() : value;

            return {
              key,
              value: value && typeof value === 'object' ? JSON.stringify(value) : value,
              description,
            };
          }).filter((e) => !!e);
        }
      }

      if (descriptor.exampleGroup) {
        for (const [ group, example ] of Object.entries(descriptor.exampleGroup)) {
          const [ groupName, ] = group.split('#');
          let i = 0;

          while (true) {
            const param = example.prop.param?.[i];
            const success = example.prop.success?.[i];
            const error = example.prop.error?.[i];

            if (!param && !success && !error) {
              break;
            }

            let requestValue = param.description.join('\n');

            if (requestValue) {
              switch (param.type || example.contentType) {
                case 'json':
                  try {
                    let val = JSON.parse(requestValue);

                    if (config?.requestDefaults) {
                      val = defaults(
                        val,
                        requestSampleBody,
                      );
                    }

                    requestValue = JSON.stringify(val, undefined, 2);
                  } catch (e) {
                    utils.logger.warn(`Failed to parse JSON example: ${e.message}`);
                  }
              }
            }

            let responses = []; // { contentType, response, statusCode, value }[]

            for (const response of [ success, error ]) {
              if (response) {
                const contentType =
                  response.type ||
                  example.contentType ||
                  (response === success ? descriptor.successContentType[0] : descriptor.errorContentType[0]);
      
                let responseValue = response.description.join('\n');

                if (responseValue) {
                  switch (contentType) {
                    case 'json':
                      try {
                        let val = JSON.parse(responseValue);

                        if (config?.responseDefaults) {
                          const paramGroupVariant = response === success
                            ? descriptor.successGroupVariant[groupName || null]
                            : descriptor.errorGroupVariant[groupName || null];
                          const paramDescriptors = response === success
                            ? descriptor.success
                            : descriptor.error;

                          if (paramGroupVariant) {
                            val = utils.convertParamGroupVariantToSampleBodyAndMergeAsDefaultWith(
                              val,
                              paramGroupVariant.prop,
                              paramDescriptors,
                              opts,
                            );
                          }
                        }
    
                        responseValue = JSON.stringify(val, undefined, 2);
                      } catch (e) {
                        utils.logger.warn(`Failed to parse JSON example: ${e.message}`, e);
                      }
                  }
                }

                responses.push({
                  contentType,
                  response,
                  statusCode: response.statusCode ?? (response === success ? 200 : 500),
                  value: responseValue,
                });
              }
            }

            for (const response of responses) {
              item.responses.push({
                name: response?.response.title ?? null,
                body: response?.value ?? null,
                _postman_previewlanguage: response.contentType ?? 'text',
                originalRequest: {
                  url: `${root}${protocolPath}${url.hash}`,
                  method: item.request.method,
                  auth: item.request.auth,
                  headers: item.request.header,
                  body: {
                    mode: 'raw',
                    raw: requestValue ?? null,
                    options: {
                      raw: {
                        language: response.contentType ?? 'text',
                      },
                    },
                  },
                  description: param?.title ?? null,
                },
                status: response.statusCode,
              });
            }

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
