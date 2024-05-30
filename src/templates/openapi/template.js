const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserOpenAPIUtils = require('../../parser.openapi.1.2.utils');
const URL = require('url').URL;

const contentTypeToOpenapiContentType = {
  form: 'application/x-www-form-urlencoded',
  json: 'application/json',
  xml: 'application/xml',
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
      servers: [{ url: '/' }],
      components: {},
      paths: {},
    };

    const tags = {};

    parserUtils.enumChapters(params.chapters, ({descriptor}) => {
      if (descriptor.note) {
        spec.info.description += `\n\n# ${descriptor.title}`;

        if (descriptor.description?.length) {
          spec.info.description += descriptor.description.map((description) => `\n\n${description}`);
        }
      }

      if (!descriptor.api) {
        return;
      }

      const url = new URL(parserUtils.addUriDefaultScheme(descriptor.api.endpoint));
      const endpoint = url.pathname.replace(/:(\w+)/g, (_, p) => `{${p}}`) + url.search.replace(/:(\w+)/g, (_, p) => `{${p}}`);

      if (!(endpoint in spec.paths)) {
        spec.paths[endpoint] = {};
      }

      const uriParams = {};

      parserOpenAPIUtils.enumUriPlaceholders(endpoint, (placeholder, isInQuery) => {
        uriParams[placeholder] = isInQuery;
      });

      const responses = {};

      for (const contentType of descriptor.contentType) {
        if (!descriptor.successGroupVariant && !descriptor.errorGroupVariant) {
          responses['default'] = {description: 'No description'};
        } else {
          if (descriptor.successGroupVariant) {
            Object.entries(descriptor.successGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
              let schema;

              if (descriptor.successRootGroupVariant && descriptor.successRootGroupVariant[groupVariantKey]) {
                descriptor.success[-1] = descriptor.successRoot[0];
                schema = parserUtils.convertParamGroupVariantToJsonSchema({
                  $: [ { list: [ -1 ], parent: null, prop: groupVariant.prop } ]
                }, descriptor.success)?.properties?.$;
              } else {
                schema = parserUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.success);
              }

              responses[groupVariantKey === 'null' ? '200' : /^\d\d\d$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`] = {
                description: 'No description',
                content: schema ? {
                  [contentTypeToOpenapiContentType[contentType]]: {
                    schema,
                  },
                } : undefined,
              };
            });
          } else if (descriptor.successRootGroupVariant) {
            Object.entries(descriptor.successRootGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
              const success = [ descriptor.successRoot[0] ];
              schema = parserUtils.convertParamGroupVariantToJsonSchema({
                $: [ { list: [ 0 ], parent: null, prop: groupVariant.prop } ]
              }, success)?.properties?.$;

              responses[groupVariantKey === 'null' ? '200' : /^\d\d\d$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`] = {
                description: 'No description',
                content: schema ? {
                  [contentTypeToOpenapiContentType[contentType]]: {
                    schema,
                  },
                } : undefined,
              };
            });
          }

          if (descriptor.errorGroupVariant) {
            Object.entries(descriptor.errorGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
              let schema;

              if (descriptor.errorRootGroupVariant && descriptor.errorRootGroupVariant[groupVariantKey]) {
                descriptor.error[-1] = descriptor.errorRoot[0];
                schema = parserUtils.convertParamGroupVariantToJsonSchema({
                  $: [ { list: [ -1 ], parent: null, prop: groupVariant.prop } ]
                }, descriptor.error)?.properties?.$;
              } else {
                schema = parserUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.error);
              }
              
              responses[groupVariantKey === 'null' ? '500' : /^\d\d\d$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`] = {
                description: 'No description',
                content: schema ? {
                  [contentTypeToOpenapiContentType[contentType]]: {
                    schema,
                  },
                } : undefined,
              };
            });
          } else if (descriptor.errorRootGroupVariant) {
            Object.entries(descriptor.errorRootGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
              const error = [ descriptor.errorRoot[0] ];
              schema = parserUtils.convertParamGroupVariantToJsonSchema({
                $: [ { list: [ 0 ], parent: null, prop: groupVariant.prop } ]
              }, error)?.properties?.$;
    
              responses[groupVariantKey === 'null' ? '200' : /^\d\d\d$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`] = {
                description: 'No description',
                content: schema ? {
                  [contentTypeToOpenapiContentType[contentType]]: {
                    schema,
                  },
                } : undefined,
              };
            });
          }
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

      if (descriptor.chapter?.name || descriptor.group?.name || descriptor?.subgroup?.name) {
        methodDescriptor.tags = [];

        if (descriptor.subgroup?.title) {
          const name = [ descriptor.chapter.title, descriptor.group.title, descriptor.subgroup?.title ].filter((e) => !!e).join(' / ');
          tags[name] = { name, description: [ ...descriptor.chapter.description, ...descriptor.group.description, ...descriptor.subgroup.description ].join('\n') };
          methodDescriptor.tags.push(name);
        } else if (descriptor.group?.title) {
          const name = [ descriptor.chapter.title, descriptor.group.title ].filter((e) => !!e).join(' / ');
          tags[name] = { name, description: [ ...descriptor.chapter.description, ...descriptor.group.description ].join('\n') };
          methodDescriptor.tags.push(name);
        } else if (descriptor.chapter?.title) {
          const name = descriptor.chapter.title;
          tags[name] = { name, description: descriptor.chapter.description.join('\n') };
          methodDescriptor.tags.push(name);
        }
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
            const param = descriptor.header[headerIndex];
            const paramType = param.type.modifiers.initial.toLowerCase();

            if (true) {
              // notBodyParamIndexes.push(paramIndex);

              return {
                name: param.field.name,
                in: 'header',
                description: param.description && param.description.join('/n'),
                required: !param.field.isOptional,
                schema: {
                  ...parserUtils.convertParamTypeToJsonSchema(paramType),
                  enum: param.type.allowedValues?.length
                    ? param.type.allowedValues.map((value) => parserUtils.convertParamValueByType(paramType, value))
                    : undefined,
                  default: parserUtils.convertParamValueByType(paramType, param.field.defaultValue),
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
            const paramType = param.type.modifiers.initial.toLowerCase();

            if (param && (param.field.name in uriParams || descriptor.api.transport.method === 'get' || descriptor.api.transport.method === 'delete')) {
              notBodyParamIndexes.push(paramIndex);

              return {
                name: param.field.name,
                in: uriParams[param.field.name] === false ? 'path' : 'query',
                description: param.description && param.description.join('/n'),
                required: !param.field.isOptional,
                schema: {
                  ...parserUtils.convertParamTypeToJsonSchema(paramType),
                  enum: param.type.allowedValues?.length
                    ? param.type.allowedValues.map((value) => parserUtils.convertParamValueByType(paramType, value))
                    : undefined,
                  default: parserUtils.convertParamValueByType(paramType, param.field.defaultValue),
                },
              };
            }

            return null;
          }).filter(_ => _));

          // not to filter, param must stay at same index
          const bodyParams = descriptor.param.map((param, index) => notBodyParamIndexes.includes(index) ? null : param);

          if (bodyParams.filter((param) => !!param).length) {
            methodDescriptor.requestBody = {
              content: descriptor.contentType.reduce((acc, contentType) => {
                if (descriptor.paramRootGroupVariant && descriptor.paramRootGroupVariant[groupVariantKey]) {
                  bodyParams[-1] = descriptor.paramRoot[0];
                  schema = parserUtils.convertParamGroupVariantToJsonSchema(
                    { $: [ { list: [ -1 ], parent: null, prop: descriptor.paramGroupVariant[groupVariantKey].prop } ] },
                    bodyParams,
                  ).properties.$;
                } else {
                  schema = parserUtils.convertParamGroupVariantToJsonSchema(
                    descriptor.paramGroupVariant[groupVariantKey].prop,
                    bodyParams,
                  );
                }

                acc[contentTypeToOpenapiContentType[contentType]] = {
                  schema,
                };
    
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
            const param = descriptor.query[queryIndex];
            const paramType = param.type.modifiers.initial.toLowerCase();

            if (true) {
              // notBodyParamIndexes.push(paramIndex);

              return {
                name: param.field.name,
                in: 'query',
                description: param.description && param.description.join('/n'),
                required: !param.field.isOptional,
                schema: {
                  ...parserUtils.convertParamTypeToJsonSchema(paramType),
                  enum: param.type.allowedValues?.length
                    ? param.type.allowedValues.map((value) => parserUtils.convertParamValueByType(paramType, value))
                    : undefined,
                  default: parserUtils.convertParamValueByType(paramType, param.field.defaultValue),
                },
              };
            }

            return null;
          }).filter(_ => _));
        }
      }
    });

    spec.tags = Object.values(tags);

    const content = JSON.stringify(spec, undefined, 2);

    if (outputDir === 'stdout') {
      return content;
    } else {
      fs.writeFileSync(`${outputDir}/openapi.json`, JSON.stringify(spec, undefined, 2));
    }
  },
});
