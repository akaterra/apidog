const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserSwaggerUtils = require('../../parser.swagger.1.2.utils');
const URL = require('url').URL;

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;

    const spec = {
      openapi: '3.0.3',
      info: {
        title: params.title,
        description: params.description,
        version: params.version,
      },
      servers: [{
        url: '/',
      }],
      paths: {},
    };

    parserUtils.enumChapters(params.chapters, ({descriptor}) => {
      if (!descriptor.api) {
        return;
      }

      const endpoint = new URL(parserUtils.addUriDefaultScheme(descriptor.api.endpoint)).pathname.replace(/:(\w+)/g, (_, p) => `{${p}}`);

      if (!(endpoint in spec.paths)) {
        spec.paths[endpoint] = {};
      }

      const uriParams = {};

      parserSwaggerUtils.enumUriPlaceholders(endpoint, (placeholder, isInQuery) => {
        uriParams[placeholder] = isInQuery;
      });

      const responses = {};

      if (!descriptor.successGroupVariant && !descriptor.errorGroupVariant) {
        responses['default'] = {description: 'No description'};
      } else {
        if (descriptor.successGroupVariant) {
          Object.entries(descriptor.successGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
            responses[groupVariantKey === 'null' ? 'default' : /^\d\d\d$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`] = {
              description: 'No description',
              content: {
                '*/*': {
                  schema: parserUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.success),
                },
              },
            };
          });
        }

        if (descriptor.errorGroupVariant) {
          Object.entries(descriptor.errorGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
            responses[groupVariantKey === 'null' ? 'default' : /^\d\d\d$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`] = {
              description: 'No description',
              content: {
                '*/*': {
                  schema: parserUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.error),
                },
              },
            };
          });
        }
      }

      if (!descriptor.api.transport.method) {
        descriptor.api.transport.method = 'post';
      }

      const methodDescriptor = spec.paths[endpoint][descriptor.api.transport.method] = {
        summary: descriptor.title,
        operationId: descriptor.id,
        responses,
      };

      if (descriptor.description) {
        methodDescriptor.description = descriptor.description.join('\n');
      }

      if (descriptor.paramGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.paramGroupVariant)[0];

        if (groupVariantKey) {
          const notBodyParamIndexes = [];

          methodDescriptor.parameters = descriptor.paramGroup[groupVariantKey].list.map((paramIndex) => {
            const param = descriptor.param[paramIndex];

            if (param && (param.field.name in uriParams || descriptor.api.transport.method === 'get')) {
              notBodyParamIndexes.push(paramIndex);

              return {
                name: param.field.name,
                in: uriParams[param.field.name] === false ? 'path' : 'query',
                description: param.description && param.description.join('/n'),
                required: !param.field.isOptional,
                schema: {
                  ...parserUtils.convertParamTypeToJsonSchema(param.type.modifiers.initial.toLowerCase()),
                  enum: param.type.allowedValues.length
                    ? param.type.allowedValues
                    : undefined,
                },
              };
            }

            return null;
          }).filter(_ => _);

          const bodyParams = descriptor.param.map((param, index) => notBodyParamIndexes.includes(index) ? null : param);

          if (bodyParams.length) {
            methodDescriptor.requestBody = {
              content: descriptor.contentType.reduce((acc, contentType) => {
                switch (contentType) {
                  case 'form':
                    acc['application/x-www-form-urlencoded'] = {
                      schema: parserUtils.convertParamGroupVariantToJsonSchema(
                        descriptor.paramGroupVariant[groupVariantKey].prop,
                        bodyParams,
                      ),
                    };
    
                    break;
    
                  case 'json':
                    acc['application/json'] = {
                      schema: parserUtils.convertParamGroupVariantToJsonSchema(
                        descriptor.paramGroupVariant[groupVariantKey].prop,
                        bodyParams,
                      ),
                    };
    
                    break;
    
                  case 'xml':
                    acc['application/xml'] = {
                      schema: parserUtils.convertParamGroupVariantToJsonSchema(
                        descriptor.paramGroupVariant[groupVariantKey].prop,
                        bodyParams,
                      ),
                    };
    
                    break;
                }
    
                return acc;
              }, {}),
            };
          }
        }
      }
    });

    const content = JSON.stringify(spec, undefined, 2);

    if (outputDir === 'stdout') {
      return content;
    } else {
      fs.writeFileSync(`${outputDir}/swagger.3.0.json`, JSON.stringify(spec, undefined, 2));
    }
  },
});
