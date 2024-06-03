const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserOpenAPIUtils = require('../../parser.openapi.1.2.utils');
const URL = require('url').URL;
const { createHash } = require('crypto');

const contentTypeToOpenapiContentType = {
  form: 'application/x-www-form-urlencoded',
  json: 'application/json',
  xml: 'application/xml',
};

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;
    const compressionDepth = config.openapi?.compressionDepth ?? 2;

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
    const schemas = {};
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
                schema = maybeReplaceObjectParamsWithRef(
                  parserUtils.convertParamGroupVariantToJsonSchema({
                    $: [ { list: [ -1 ], parent: null, prop: groupVariant.prop } ],
                  }, descriptor.success)?.properties?.$,
                  schemas,
                  compressionDepth,
                );
              } else {
                schema = maybeReplaceObjectParamsWithRef(
                  parserUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.success),
                  schemas,
                  compressionDepth,
                );
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
              schema = maybeReplaceObjectParamsWithRef(
                parserUtils.convertParamGroupVariantToJsonSchema({
                  $: [ { list: [ 0 ], parent: null, prop: groupVariant.prop } ]
                }, success)?.properties?.$,
                schemas,
                compressionDepth,
              );

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
                schema = maybeReplaceObjectParamsWithRef(
                  parserUtils.convertParamGroupVariantToJsonSchema({
                    $: [ { list: [ -1 ], parent: null, prop: groupVariant.prop } ]
                  }, descriptor.error)?.properties?.$,
                  schemas,
                  compressionDepth,
                );
              } else {
                schema = maybeReplaceObjectParamsWithRef(
                  parserUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.error),
                  schemas,
                  compressionDepth,
                );
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
              schema = maybeReplaceObjectParamsWithRef(
                parserUtils.convertParamGroupVariantToJsonSchema({
                  $: [ { list: [ 0 ], parent: null, prop: groupVariant.prop } ]
                }, error)?.properties?.$,
                schemas,
                compressionDepth,
              );
    
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
                description: param.description && param.description.join('\n'),
                required: !param.field.isOptional,
                schema: {
                  ...maybeReplaceObjectParamsWithRef(
                    parserUtils.convertParamTypeToJsonSchema(paramType),
                    schemas,
                    compressionDepth,
                  ),
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
                description: param.description && param.description.join('\n'),
                required: !param.field.isOptional,
                schema: {
                  ...maybeReplaceObjectParamsWithRef(
                    parserUtils.convertParamTypeToJsonSchema(paramType),
                    schemas,
                    compressionDepth,
                  ),
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
                  schema = maybeReplaceObjectParamsWithRef(
                    parserUtils.convertParamGroupVariantToJsonSchema(
                      descriptor.paramGroupVariant[groupVariantKey].prop,
                      bodyParams,
                    ),
                    schemas,
                    compressionDepth,
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
                description: param.description && param.description.join('\n'),
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

    if (Object.keys(tags).length) {
      spec.tags = Object.values(tags);
    }

    if (Object.keys(schemas).length) {
      spec.components.schemas = schemas;
    }

    const content = JSON.stringify(spec, undefined, 2);

    if (outputDir === 'stdout') {
      return content;
    } else {
      fs.writeFileSync(`${outputDir}/openapi.json`, JSON.stringify(spec, undefined, 2));
    }
  },
});

const schemaRefsShorten = {
  $: 0,
};

function maybeReplaceObjectParamsWithRefIsComplexDef(obj) {
  if (obj?.type === 'object' || obj?.enum) {
    return true;
  }

  if (obj?.type === 'array') {
    return obj.items?.type === 'object' || obj.items?.enum;
  }

  return false;
}

function maybeReplaceObjectParamsWithRef(obj, schemaRefs, depth = 2) {
  if (depth < 1 || !maybeReplaceObjectParamsWithRefIsComplexDef(obj)) {
    return obj;
  }

  let props = obj.properties ?? obj.items?.properties;

  Object.entries(props ?? {}).forEach(([ key, val ]) => {
    if (maybeReplaceObjectParamsWithRefIsComplexDef(val)) {
      const hash = computeObjectHash(val);

      let refShortenId;

      if (!schemaRefsShorten[hash]) {
        refShortenId = `schema_${schemaRefsShorten.$ += 1}`;

        if (val.description) {
          refShortenId += `_${val.description.split('\n')[0].split('.')[0].trim().replace(/[^\p{L}]+/gu, '_').toLowerCase()}`;
        }
      } else {
        refShortenId = schemaRefsShorten[hash];
      }

      schemaRefsShorten[hash] = refShortenId;
      schemaRefs[refShortenId] = val;
      props[key] = { $ref: `#/components/schemas/${refShortenId}` };

      if (typeof val === 'object') {
        maybeReplaceObjectParamsWithRef(val, schemaRefs, depth - 1);
      }
    }
  });

  return obj;
}

function computeObjectHash(obj) {
  const pairs = [];

  computeObjectHashInternal(obj, '', pairs);

  return createHash('sha256').update(pairs.join('|')).digest('hex');
}

function computeObjectHashInternal(obj, sub = '', pairs = []) {
  if (Array.isArray(obj)) {
    Array.from(obj).sort().forEach((val, ind) => {
      pairs[`${sub}${ind}=${val}`];

      computeObjectHashInternal(val, `${sub}.${ind}`, pairs);
    });
  } else if (obj && typeof obj === 'object') {
    Object.keys(obj).sort().forEach((key) => {
      pairs[`${sub}${key}=${obj[key]}`];

      computeObjectHashInternal(obj[key], `${sub}.${key}`, pairs);
    });
  } else {
    pairs.push(`${sub}=${obj}`);
  }
}
