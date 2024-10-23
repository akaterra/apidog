const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserOpenAPIUtils = require('../../parser.openapi.utils');
const URL = require('url').URL;
const { createHash } = require('crypto');

const contentTypeToOpenapiContentType = {
  form: 'application/x-www-form-urlencoded',
  json: 'application/json',
  multipart: 'multipart/form-data',
  xml: 'application/xml',
};

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;
    const compressionDepth = (config.compressionLevel ?? 1) + 1;

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
    const tagsInitialized = {};

    parserUtils.enumChapters(params.chapters, ({descriptor}) => {
      if (descriptor.note) {
        let tagRef;

        if (!descriptor.group?.name) {
          tagRef = spec.info;
        } else {
          const [ name ] = getTagNameAndDescription(descriptor);

          if (name) {
            tags[name] = { name, description: tags[name]?.description ?? '' };
            tagRef = tags[name];
          }
        }

        if (tagRef) {
          tagRef.description = tagRef.description ? tagRef.description + `\n\n# ${descriptor.title}` : `# ${descriptor.title}`;

          if (descriptor.description?.length) {
            tagRef.description += descriptor.description.map((description) => `\n\n${description}`);
          }
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
              let schema = maybeReplaceObjectParamsWithRef(
                parserUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.success),
                schemas,
                compressionDepth,
              );
              const responseKey = groupVariantKey === 'null' ? '200' : /^\d\d\d$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`;
              const contentTypeKey = contentTypeToOpenapiContentType[contentType];

              if (responses[responseKey]?.content?.[contentTypeKey]) {
                const oldShema = responses[responseKey].content[contentTypeKey].schema;

                if (!oldShema?.oneOf) {
                  responses[responseKey].content[contentTypeKey].schema = {
                    oneOf: [ oldShema ],
                  };
                }

                if (schema.oneOf) {
                  responses[responseKey].content[contentTypeKey].schema.oneOf.push(...schema.oneOf);
                } else {
                  responses[responseKey].content[contentTypeKey].schema.oneOf.push(schema);
                }

                schema = responses[responseKey].content[contentTypeKey].schema;
              }

              responses[responseKey] = {
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
              let schema = maybeReplaceObjectParamsWithRef(
                parserUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.error),
                schemas,
                compressionDepth,
              );
              const responseKey = groupVariantKey === 'null' ? '500' : /^\d\d\d$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`;
              const contentTypeKey = contentTypeToOpenapiContentType[contentType];

              if (responses[responseKey]?.content?.[contentTypeKey]) {
                const oldShema = responses[responseKey].content[contentTypeKey].schema;

                if (!oldShema?.oneOf) {
                  responses[responseKey].content[contentTypeKey].schema = {
                    oneOf: [ oldShema ],
                  };
                }

                if (schema.oneOf) {
                  responses[responseKey].content[contentTypeKey].schema.oneOf.push(...schema.oneOf);
                } else {
                  responses[responseKey].content[contentTypeKey].schema.oneOf.push(schema);
                }

                schema = responses[responseKey].content[contentTypeKey].schema;
              }

              responses[responseKey] = {
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

        const [ name, description ] = getTagNameAndDescription(descriptor);

        if (name && !tagsInitialized[name]) {
          tags[name] = { name, description: tags[name]?.description ? `${description}\n${tags[name]?.description}` : description };
          tagsInitialized[name] = true;
        }

        if (name) {
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
                    parserUtils.convertParamToJsonSchema(param),
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
            const isQueryParam = param && !descriptor.queryGroupVariant?.[groupVariantKey] && (
              param.field.name in uriParams ||
              descriptor.api.transport.method === 'get' ||
              descriptor.api.transport.method === 'delete'
            );

            if (isQueryParam) {
              notBodyParamIndexes.push(paramIndex);

              return {
                name: param.field.name,
                in: uriParams[param.field.name] === false ? 'path' : 'query',
                description: param.description && param.description.join('\n'),
                required: !param.field.isOptional,
                schema: {
                  ...maybeReplaceObjectParamsWithRef(
                    parserUtils.convertParamToJsonSchema(param),
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
                schema = maybeReplaceObjectParamsWithRef(
                  parserUtils.convertParamGroupVariantToJsonSchema(
                    descriptor.paramGroupVariant[groupVariantKey].prop,
                    bodyParams,
                  ),
                  schemas,
                  compressionDepth,
                );

                const encoding = schema?.properties ? Object.entries(schema.properties).reduce((acc, [key, value]) => {
                  if (value?.type === 'object' && value?.properties) {
                    acc[key] = {
                      contentType: 'application/json',
                    };
                  }

                  return acc;
                }, {}) : undefined;

                acc[contentTypeToOpenapiContentType[contentType]] = {
                  schema,
                  encoding,
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
                in: uriParams[param.field.name] === false ? 'path' : 'query',
                description: param.description && param.description.join('\n'),
                required: !param.field.isOptional,
                schema: {
                  ...parserUtils.convertParamToJsonSchema(param),
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
  $: 1,
};
const schemaRefsToReplaceOnMoreThanOne = {

};
const schemaRefsShortenIdUsed = new Set();

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
      if (val && typeof val === 'object') {
        maybeReplaceObjectParamsWithRef(val, schemaRefs, depth - 1);
      }

      const hash = computeHash(val);

      let refShortenId;

      if (!schemaRefsShorten[hash]) {
        if (!schemaRefsToReplaceOnMoreThanOne[hash] || schemaRefsToReplaceOnMoreThanOne[hash][0] === props) {
          schemaRefsToReplaceOnMoreThanOne[hash] = [ props, key ];

          return;
        }

        let refShortenIdExtra = '';

        if (val.description) {
          refShortenIdExtra = `_${val.description.split('\n')[0].split('.')[0].trim().replace(/[^\p{L}]+/gu, '_').toLowerCase()}`;
        }

        refShortenId = `schema_${schemaRefsShorten.$}${refShortenIdExtra}`;

        if (schemaRefsShortenIdUsed.has(refShortenId)) {
          refShortenId = `schema_${schemaRefsShorten.$ += 1}${refShortenIdExtra}`;
        }

        schemaRefsShortenIdUsed.add(refShortenId);

        const [ ref, refKey ] = schemaRefsToReplaceOnMoreThanOne[hash];

        ref[refKey] = { $ref: `#/components/schemas/${refShortenId}` };
      } else {
        refShortenId = schemaRefsShorten[hash];
      }

      schemaRefsShorten[hash] = refShortenId;
      schemaRefs[refShortenId] = val;
      props[key] = { $ref: `#/components/schemas/${refShortenId}` };
    }
  });

  return obj;
}

function getTagNameAndDescription(descriptor) {
  if (descriptor.subgroup?.title) {
    return [
      [ descriptor.chapter.title, descriptor.group.title, descriptor.subgroup?.title ].filter((e) => !!e).join(' / '),
      [ ...descriptor.chapter.description, ...descriptor.group.description, ...descriptor.subgroup.description ].join('\n'),
    ];
  }
  
  if (descriptor.group?.title) {
    return [
      [ descriptor.chapter.title, descriptor.group.title ].filter((e) => !!e).join(' / '),
      [ ...descriptor.chapter.description, ...descriptor.group.description ].join('\n'),
    ];
  }
  
  if (descriptor.chapter?.title) {
    return [
      descriptor.chapter.title,
      descriptor.chapter.description.join('\n'),
    ];
  }

  return [ null, null ];
}

function isPrimitiveValue(value) {
  return value === null || typeof value !== 'object';
}

function computeHash(obj) {
  const pairs = [];

  computeHashInternal(obj, '', pairs);

  return createHash('sha256').update(pairs.join('|')).digest('hex');
}

function computeHashInternal(val, sub = '', pairs = []) {
  if (Array.isArray(val)) {
    Array.from(val).sort().forEach((val, ind) => {
      if (isPrimitiveValue(val)) {
        pairs.push(`${sub}${ind}=${val}`);
      } else {
        computeHashInternal(val, `${sub}.${ind}`, pairs);
      }
    });
  } else if (!isPrimitiveValue(val)) {
    Object.keys(val).sort().forEach((key) => {
      if (isPrimitiveValue(val[key])) {
        pairs.push(`${sub}${key}=${val[key]}`);
      } else {
        computeHashInternal(val[key], `${sub}.${key}`, pairs);
      }
    });
  } else {
    pairs.push(`${sub}=${val}`);
  }
}
