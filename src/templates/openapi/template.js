const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserJsonSchemaUtils = require('../../parser.jsonschema.utils');
const parserOpenAPIUtils = require('../../parser.openapi.utils');
const utils = require('../../utils');
const URL = require('url').URL;
const { createHash } = require('crypto');
const set = require('lodash.set');
const yaml = require('js-yaml');

const CONTENT_TYPE_TO_OPENAPI_CONTENT_TYPE = {
  form: 'application/x-www-form-urlencoded',
  json: 'application/json',
  multipart: 'multipart/form-data',
  xml: 'application/xml',
};
const SPEC_VERSION = '3.0';
const SCHEMA_NEW_NULLABLE = SPEC_VERSION === '3.1';

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;
    const compressionDepth = config.compressionLevel ?? 1;
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
      openapi: SPEC_VERSION === '3.0' ? '3.0.3' : '3.1.1',
      info: {
        title: params.title,
        description: params.description,
        version: params.version,
      },
      servers: config.server ? config.server.map((url) => ({ url })) : [{ url: '/' }],
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
          if (!descriptor.isDefUsed) {
            tagRef.description = tagRef.description
              ? tagRef.description + `\n# ${descriptor.title}`
              : `# ${descriptor.title}`;
          }

          if (tagRef.description.length) {
            tagRef.description += '\n';
          }

          if (descriptor.description?.length) {
            tagRef.description += utils.joinDescription(descriptor.description);
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
      const responses = {};

      parserOpenAPIUtils.enumUriPlaceholders(endpoint, (placeholder, isInQuery) => {
        uriParams[placeholder] = isInQuery;
      });

      if (!descriptor.api.transport.method) {
        descriptor.api.transport.method = 'post';
      }

      const methodDescriptor = spec.paths[endpoint][descriptor.api.transport.method] = {
        summary: descriptor.title,
        operationId: descriptor.id,
        responses,
      };

      if (descriptor.description) {
        methodDescriptor.description = utils.joinDescription(descriptor.description);
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

      if (Object.keys(descriptor.authCookieGroupVariant ?? {})[0] && !spec.components.securitySchemes) {
        spec.components.securitySchemes = {};
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

      if (descriptor.authCookieGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.authCookieGroupVariant)[0];

        if (groupVariantKey) {
          if (!methodDescriptor.security) {
            methodDescriptor.security = [];
          }

          descriptor.authCookieGroup[groupVariantKey].list.forEach((authCookieIndex) => {
            const authCookie = descriptor.authCookie[authCookieIndex];
            methodDescriptor.security.push({ [authCookie.group || 'default']: [] });

            switch (authCookie.type.modifiers.initial) {
              case 'apikey':
                spec.components.securitySchemes[authCookie.group || 'default'] = { type: 'apiKey', in: 'cookie', name: authCookie.field.name };
                break;

              case 'basic':
              case 'bearer':
                spec.components.securitySchemes[authCookie.group || 'default'] = { type: 'http', scheme: authCookie.type.modifiers.initial, name: authCookie.field.name };
                break;
            }
          });
        }
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
                spec.components.securitySchemes[authParam.group || 'default'] = { type: 'http', scheme: authParam.type.modifiers.initial, name: authParam.field.name };
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
                spec.components.securitySchemes[authQuery.group || 'default'] = { type: 'http', scheme: authQuery.type.modifiers.initial, name: authQuery.field.name };
                break;
            }
          });
        }
      }

      if (Object.keys(descriptor.cookieGroupVariant ?? {})[0] && !methodDescriptor.parameters) {
        methodDescriptor.parameters = [];
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

      if (descriptor.cookieGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.cookieGroupVariant)[0];

        if (groupVariantKey) {
          schema = maybeReplaceObjectParamsWithRef(
            parserJsonSchemaUtils.convertParamGroupVariantToJsonSchema(
              descriptor.cookieGroupVariant[groupVariantKey].prop,
              descriptor.cookie,
              undefined,
              { newNullable: SCHEMA_NEW_NULLABLE },
            ),
            schemas,
            compressionDepth,
          );

          methodDescriptor.parameters = methodDescriptor.parameters.concat(Object.entries(schema.properties ?? {}).map(([ key, keySchema ]) => {
            return {
              name: key,
              in: 'cookie',
              description: keySchema.description,
              required: !!schema.required?.includes(key),
              schema: keySchema,
            };
          }));
        }
      }

      if (descriptor.headerGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.headerGroupVariant)[0];

        if (groupVariantKey) {
          schema = maybeReplaceObjectParamsWithRef(
            parserJsonSchemaUtils.convertParamGroupVariantToJsonSchema(
              descriptor.headerGroupVariant[groupVariantKey].prop,
              descriptor.header,
              undefined,
              { newNullable: SCHEMA_NEW_NULLABLE },
            ),
            schemas,
            compressionDepth,
          );

          methodDescriptor.parameters = methodDescriptor.parameters.concat(Object.entries(schema.properties ?? {}).map(([ key, keySchema ]) => {
            return {
              name: key,
              in: 'header',
              description: keySchema.description,
              required: !!schema.required?.includes(key),
              schema: keySchema,
            };
          }));
        }
      }

      if (descriptor.paramGroupVariant) {
        const [ groupVariantKey, groupVariant ] = Object.entries(descriptor.paramGroupVariant)[0];

        if (groupVariant) {
          const notBodyParamKeys = [];

          schema = maybeReplaceObjectParamsWithRef(
            parserJsonSchemaUtils.convertParamGroupVariantToJsonSchema(
              groupVariant.prop,
              descriptor.param,
              undefined,
              { newNullable: SCHEMA_NEW_NULLABLE },
            ),
            schemas,
            compressionDepth,
          );

          for (const subSchema of schema.oneOf ? schema.oneOf : [ schema ]) {
            methodDescriptor.parameters = methodDescriptor.parameters.concat(Object.entries(subSchema.properties ?? {}).map(([ key, keySchema ]) => {
              const isQueryParam = (
                key in uriParams ||
                descriptor.api.transport.method === 'get' ||
                descriptor.api.transport.method === 'delete'
              );

              if (!isQueryParam) {
                return null;
              }

              notBodyParamKeys.push(key);

              return {
                name: key,
                in: uriParams[key] === false ? 'path' : 'query',
                description: keySchema.description,
                required: !!subSchema.required?.includes(key),
                schema: keySchema,
              };
            }).filter(_ => _));

            // not to filter, param must stay at same index
            const bodyParams = descriptor.param.map((param) => notBodyParamKeys.includes(param.field.name) ? null : param);

            if (bodyParams.filter((param) => !!param).length) {
              methodDescriptor.requestBody = {
                content: descriptor.contentType.reduce((acc, contentType) => {
                  schema = maybeReplaceObjectParamsWithRef(
                    parserJsonSchemaUtils.convertParamGroupVariantToJsonSchema(
                      groupVariant.prop,
                      bodyParams,
                      undefined,
                      { newNullable: SCHEMA_NEW_NULLABLE },
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

                  const examples = {};

                  if (descriptor.exampleGroup) {
                    for (const [ group, example ] of Object.entries(descriptor.exampleGroup)) {
                      const [ groupName, ] = group.split('#');

                      if (groupVariantKey !== (groupName || 'null')) {
                        continue;
                      }

                      if (example.prop.param) {
                        example.prop.param.forEach((param) => {
                          if (param.type !== contentType) {
                            return;
                          }

                          let value = utils.joinDescription(param.description).trim();

                          switch (param.type) {
                            case 'json':
                              try {
                                let val = JSON.parse(value);

                                if (config?.requestDefaults) {
                                  val = utils.convertParamGroupVariantToSampleBodyAndMergeAsDefaultWith(
                                    val,
                                    groupVariant.prop,
                                    bodyParams,
                                    opts,
                                  );
                                }

                                value = val;
                              } catch (e) {
                                utils.logger.warn(`Failed to parse JSON example for ${group} group: ${e.message}`, e);
                              }
                          }

                          examples[group || null] = {
                            summary: param.title,
                            value: value,
                          };
                        });
                      }
                    }
                  }

                  acc[CONTENT_TYPE_TO_OPENAPI_CONTENT_TYPE[contentType]] = {
                    schema,
                    encoding,
                  };

                  if (Object.keys(examples).length) {
                    acc[CONTENT_TYPE_TO_OPENAPI_CONTENT_TYPE[contentType]].examples = examples;
                  }
      
                  return acc;
                }, {}),
              };
            }
          }
        }
      }

      if (descriptor.queryGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.queryGroupVariant)[0];

        if (groupVariantKey) {
          schema = maybeReplaceObjectParamsWithRef(
            parserJsonSchemaUtils.convertParamGroupVariantToJsonSchema(
              descriptor.queryGroupVariant[groupVariantKey].prop,
              descriptor.query,
              undefined,
              { newNullable: SCHEMA_NEW_NULLABLE },
            ),
            schemas,
            compressionDepth,
          );

          methodDescriptor.parameters = methodDescriptor.parameters.concat(Object.entries(schema.properties ?? {}).map(([ key, keySchema ]) => {
            return {
              name: key,
              in: uriParams[key] === false ? 'path' : 'query',
              description: keySchema.description,
              required: !!schema.required?.includes(key),
              schema: keySchema,
            };
          }));
        }
      }

      if (!descriptor.successGroupVariant && !descriptor.errorGroupVariant) {
        responses['default'] = { description: 'No response' };
      } else {
        for (const contentType of descriptor.successContentType ?? descriptor.contentType) {
          if (descriptor.successGroupVariant) {
            Object.entries(descriptor.successGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
              let schema = maybeReplaceObjectParamsWithRef(
                parserJsonSchemaUtils.convertParamGroupVariantToJsonSchema(
                  groupVariant.prop,
                  descriptor.success,
                  undefined,
                  { newNullable: SCHEMA_NEW_NULLABLE },
                ),
                schemas,
                compressionDepth,
              );
              const responseKey = groupVariant.statusCode == null ? '200' : /^\d\d\d$/.test(groupVariant.statusCode) ? groupVariant.statusCode : `x-${groupVariant.statusCode}`;
              const contentTypeKey = CONTENT_TYPE_TO_OPENAPI_CONTENT_TYPE[contentType];

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

              if (!responses[responseKey]) {
                responses[responseKey] = { description: 'No description', content: {} };
              }

              const oldExamples = responses[responseKey]?.content?.[contentTypeKey]?.examples ?? {};

              if (descriptor.exampleGroup) {
                for (const [ group, example ] of Object.entries(descriptor.exampleGroup)) {
                  const [ groupName, ] = group.split('#');

                  if (groupVariantKey !== (groupName || 'null')) {
                    continue;
                  }

                  if (example.prop.success) {
                    example.prop.success.forEach((param) => {
                      if (param.type !== contentType) {
                        return;
                      }

                      let value = utils.joinDescription(param.description).trim();

                      switch (param.type) {
                        case 'json':
                          try {
                            let val = JSON.parse(value);

                            if (config?.responseDefaults) {
                              val = utils.convertParamGroupVariantToSampleBodyAndMergeAsDefaultWith(
                                val,
                                groupVariant.prop,
                                descriptor.success,
                                opts,
                              );
                            }

                            value = val;
                          } catch (e) {
                            utils.logger.warn(`Failed to parse JSON example for ${group} group: ${e.message}`, e);
                          }
                      }

                      oldExamples[group] = {
                        summary: param.title,
                        value: value,
                      };
                    });
                  }
                }
              }

              set(responses[responseKey], `content.${contentTypeKey}.schema`, schema);

              if (Object.keys(oldExamples).length) {
                set(responses[responseKey], `content.${contentTypeKey}.examples`, oldExamples);
              }
            });
          }
        }

        for (const contentType of descriptor.errorContentType || descriptor.contentType) {
          if (descriptor.errorGroupVariant) {
            Object.entries(descriptor.errorGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
              let schema = maybeReplaceObjectParamsWithRef(
                parserJsonSchemaUtils.convertParamGroupVariantToJsonSchema(
                  groupVariant.prop,
                  descriptor.error,
                  undefined,
                  { newNullable: SCHEMA_NEW_NULLABLE },
                ),
                schemas,
                compressionDepth,
              );
              const responseKey = groupVariant.statusCode == null ? '500' : /^\d\d\d?$/.test(groupVariant.statusCode) ? groupVariant.statusCode : `x-${groupVariant.statusCode}`;
              const contentTypeKey = CONTENT_TYPE_TO_OPENAPI_CONTENT_TYPE[contentType];

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

              if (!responses[responseKey]) {
                responses[responseKey] = { description: 'No description', content: {} };
              }

              const oldExamples = responses[responseKey]?.content?.[contentTypeKey]?.examples ?? {};

              if (descriptor.exampleGroup) {
                for (const [ group, example ] of Object.entries(descriptor.exampleGroup)) {
                  const [ groupName, ] = group.split('#');

                  if (groupVariantKey !== (groupName || 'null')) {
                    continue;
                  }

                  if (example.prop.error) {
                    example.prop.error.forEach((param) => {
                      if (param.type !== contentType) {
                        return;
                      }

                      let value = utils.joinDescription(param.description).trim();

                      switch (param.type) {
                        case 'json':
                          try {
                            let val = JSON.parse(value);

                            if (config?.responseDefaults) {
                              val = utils.convertParamGroupVariantToSampleBodyAndMergeAsDefaultWith(
                                val,
                                groupVariant.prop,
                                descriptor.error,
                                opts,
                              );
                            }

                            value = val;
                          } catch (e) {
                            utils.logger.warn(`Failed to parse JSON example for ${group} group: ${e.message}`, e);
                          }
                      }

                      oldExamples[group] = {
                        summary: param.title,
                        value: value,
                      };
                    });
                  }
                }
              }

              set(responses[responseKey], `content.${contentTypeKey}.schema`, schema);

              if (Object.keys(oldExamples).length) {
                set(responses[responseKey], `content.${contentTypeKey}.examples`, oldExamples);
              }
            });
          }
        }
      }
    });

    if (Object.keys(tags).length) {
      spec.tags = Object.values(tags);
    }

    if (Object.keys(schemas).length) {
      spec.components.schemas = schemas;
    }

    const outputFormats = config.outputFormat?.length ? config.outputFormat : [ 'json' ];

    for (const outputFormat of outputFormats) {
      let content;
      let outputName;

      switch (outputFormat) {
        case 'jsConst':
          content = `export const Spec = ${JSON.stringify(spec, undefined, 2)};`;
          outputName = 'openapi.js';
          break;
        case 'tsConst':
          content = `export const Spec = ${JSON.stringify(spec, undefined, 2)} as const;`;
          outputName = 'openapi.ts';
          break;
        case 'json':
          content = JSON.stringify(spec, undefined, 2);
          outputName = 'openapi.json';
          break;
        case 'py':
          const tid = '_' + Date.now() + Math.random().toString().slice(2, 12) + '_';
          const pyReplacer = (key, val) => {
            if (val === true) {
              return tid + 'True';
            }

            if (val === false) {
              return tid + 'False';
            }

            if (val === null) {
              return tid + 'None';
            }

            return val;
          };
          content = `Spec = ${JSON.stringify(spec, pyReplacer, 2)}`.replace(new RegExp(`"${tid}(True|False|None)"`, 'g'), '$1');
          outputName = 'openapi.py';
          break;
        case 'yaml':
          content = yaml.dump(spec);
          outputName = 'openapi.yaml';
          break;  
        default:
          content = outputFormat.replace(/{{content}}/g, content);
          outputName = 'openapi.json';

          if (content === outputFormat) {
            throw new Error(`"{{content}}" placeholder expected for custom output format, check "outputFormat" option`);
          }
      }

      content = utils.replacePlaceholders(content, config.placeholders);

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
      utils.joinDescription([ ...descriptor.chapter.description, ...descriptor.group.description, ...descriptor.subgroup.description ]),
    ];
  }
  
  if (descriptor.group?.title) {
    return [
      [ descriptor.chapter.title, descriptor.group.title ].filter((e) => !!e).join(' / '),
      utils.joinDescription([ ...descriptor.chapter.description, ...descriptor.group.description ]),
    ];
  }
  
  if (descriptor.chapter?.title) {
    return [
      descriptor.chapter.title,
      utils.joinDescription(descriptor.chapter.description),
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
