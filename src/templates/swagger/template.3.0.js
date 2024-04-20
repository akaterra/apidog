const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserSwaggerUtils = require('../../parser.swagger.1.2.utils');
const URL = require('url').URL;

const PARAM_VALUE_BY_TYPE = {
  'Boolean': (value) => value && value !== '0' && value !== 'false' ? true : false,
  'Boolean:Enum': (value) => value && value !== '0' && value !== 'false' ? true : false,
  'Number': (value) => parseFloat(value),
  'Number:Enum': (value) => parseFloat(value),
};

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
      components: {},
      paths: {},
    };

    parserUtils.enumChapters(params.chapters, ({descriptor}) => {
      if (!descriptor.api) {
        return;
      }

      const url = new URL(parserUtils.addUriDefaultScheme(descriptor.api.endpoint));
      const endpoint = url.pathname.replace(/:(\w+)/g, (_, p) => `{${p}}`) + url.search.replace(/:(\w+)/g, (_, p) => `{${p}}`);

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
            responses[groupVariantKey === 'null' ? '200' : /^\d\d\d$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`] = {
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
            responses[groupVariantKey === 'null' ? '500' : /^\d\d\d$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`] = {
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

      if (Object.keys(descriptor.authHeaderGroupVariant ?? {})[0] && !spec.components.securitySchemes) {
        spec.components.securitySchemes = {};
      }

      if (Object.keys(descriptor.authParamGroupVariant ?? {})[0] && !spec.components.securitySchemes) {
        spec.components.securitySchemes = {};
      }

      if (Object.keys(descriptor.authQueryGroupVariant ?? {})[0] && !spec.components.securitySchemes) {
        spec.components.securitySchemes = {};
      }

      if (descriptor.authHeaderGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.authHeaderGroupVariant)[0];

        if (groupVariantKey) {
          if (!methodDescriptor.security) {
            methodDescriptor.security = [];
          }

          descriptor.authHeaderGroup[groupVariantKey].list.forEach((authHeaderIndex) => {
            const authHeader = descriptor.authHeader[authHeaderIndex];
            methodDescriptor.security.push({ [authHeader.group || 'default']: [] });

            switch (authHeader.type.modifiers.initial) {
              case 'apikey':
                spec.components.securitySchemes[authHeader.group || 'default'] = { type: 'apiKey', in: 'header', name: authHeader.field.name };
                break;

              case 'basic':
              case 'bearer':
                spec.components.securitySchemes[authHeader.group || 'default'] = { type: authHeader.type.modifiers.initial, name: authHeader.field.name };
                break;
            }
          });
        }
      }

      if (descriptor.authParamGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.authParamGroupVariant)[0];

        if (groupVariantKey) {
          if (!methodDescriptor.security) {
            methodDescriptor.security = [];
          }

          descriptor.authParamGroup[groupVariantKey].list.forEach((authParamIndex) => {
            const authParam = descriptor.authParam[authParamIndex];
            methodDescriptor.security.push({ [authParam.group || 'default']: [] });

            switch (authParam.type.modifiers.initial) {
              case 'apikey':
                spec.components.securitySchemes[authParam.group || 'default'] = { type: 'apiKey', in: uriParams[param.field.name] === false ? 'path' : 'query', name: authParam.field.name };
                break;

              case 'basic':
              case 'bearer':
                spec.components.securitySchemes[authParam.group || 'default'] = { type: authParam.type.modifiers.initial, name: authParam.field.name };
                break;
            }
          });
        }
      }

      if (descriptor.authQueryGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.authQueryGroupVariant)[0];

        if (groupVariantKey) {
          if (!methodDescriptor.security) {
            methodDescriptor.security = [];
          }

          descriptor.authQueryGroup[groupVariantKey].list.forEach((authQueryIndex) => {
            const authQuery = descriptor.authParam[authQueryIndex];
            methodDescriptor.security.push({ [authQuery.group || 'default']: [] });

            switch (authQuery.type.modifiers.initial) {
              case 'apikey':
                spec.components.securitySchemes[authQuery.group || 'default'] = { type: 'apiKey', in: 'query', name: authQuery.field.name };
                break;

              case 'basic':
              case 'bearer':
                spec.components.securitySchemes[authQuery.group || 'default'] = { type: authQuery.type.modifiers.initial, name: authQuery.field.name };
                break;
            }
          });
        }
      }

      if (Object.keys(descriptor.paramGroupVariant ?? {})[0] && !methodDescriptor.parameters) {
        methodDescriptor.parameters = [];
      }

      if (Object.keys(descriptor.queryGroupVariant ?? {})[0] && !methodDescriptor.parameters) {
        methodDescriptor.parameters = [];
      }

      if (Object.keys(descriptor.headerGroupVariant ?? {})[0] && !methodDescriptor.parameters) {
        methodDescriptor.parameters = [];
      }

      if (descriptor.headerGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.headerGroupVariant)[0];

        if (groupVariantKey) {
          // const notBodyParamIndexes = [];

          methodDescriptor.parameters = methodDescriptor.parameters.concat(descriptor.headerGroup[groupVariantKey].list.map((headerIndex) => {
            const header = descriptor.header[headerIndex];

            if (true) {
              // notBodyParamIndexes.push(paramIndex);

              return {
                name: header.field.name,
                in: 'header',
                description: header.description && header.description.join('/n'),
                required: !header.field.isOptional,
                schema: {
                  ...parserUtils.convertParamTypeToJsonSchema(header.type.modifiers.initial.toLowerCase()),
                  enum: header.type.allowedValues.length
                    ? header.type.allowedValues
                    : undefined,
                  default: header.field.defaultValue,
                },
              };
            }

            return null;
          }).filter(_ => _));
        }
      }

      if (descriptor.paramGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.paramGroupVariant)[0];

        if (groupVariantKey) {
          const notBodyParamIndexes = [];

          methodDescriptor.parameters = methodDescriptor.parameters.concat(descriptor.paramGroup[groupVariantKey].list.map((paramIndex) => {
            const param = descriptor.param[paramIndex];

            if (param && (param.field.name in uriParams || descriptor.api.transport.method === 'get' || descriptor.api.transport.method === 'delete')) {
              notBodyParamIndexes.push(paramIndex);

              return {
                name: param.field.name,
                in: uriParams[param.field.name] === false ? 'path' : 'query',
                description: param.description && param.description.join('/n'),
                required: !param.field.isOptional,
                schema: {
                  ...parserUtils.convertParamTypeToJsonSchema(param.type.modifiers.initial.toLowerCase()),
                  enum: param.type.allowedValues.length
                    ? PARAM_VALUE_BY_TYPE[param.type.name] ? param.type.allowedValues.map((value) => PARAM_VALUE_BY_TYPE[param.type.name](value)) : param.type.allowedValues
                    : undefined,
                  default: param.field.defaultValue,
                },
              };
            }

            return null;
          }).filter(_ => _));

          const bodyParams = descriptor.param.map((param, index) => notBodyParamIndexes.includes(index) ? null : param);

          if (bodyParams.filter((param) => !!param).length) {
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

      if (descriptor.queryGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.queryGroupVariant)[0];

        if (groupVariantKey) {
          // const notBodyParamIndexes = [];

          methodDescriptor.parameters = methodDescriptor.parameters.concat(descriptor.queryGroup[groupVariantKey].list.map((queryIndex) => {
            const query = descriptor.query[queryIndex];

            if (true) {
              // notBodyParamIndexes.push(paramIndex);

              return {
                name: query.field.name,
                in: 'query',
                description: query.description && query.description.join('/n'),
                required: !query.field.isOptional,
                schema: {
                  ...parserUtils.convertParamTypeToJsonSchema(query.type.modifiers.initial.toLowerCase()),
                  enum: query.type.allowedValues.length
                    ? query.type.allowedValues
                    : undefined,
                  default: query.field.defaultValue,
                },
              };
            }

            return null;
          }).filter(_ => _));
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
