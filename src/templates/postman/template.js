const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserOpenAPIUtils = require('../../parser.openapi.utils');
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
// const SPEC_VERSION = '3.0';
// const SCHEMA_NEW_NULLABLE = SPEC_VERSION === '3.1';

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;
    const compressionDepth = config.compressionLevel ?? 1;

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
      // if (descriptor.note) {
      //   let tagRef;

      //   if (!descriptor.group?.name) {
      //     tagRef = spec.info;
      //   } else {
      //     const [ name ] = getTagNameAndDescription(descriptor);

      //     if (name) {
      //       tags[name] = { name, description: tags[name]?.description ?? '' };
      //       tagRef = tags[name];
      //     }
      //   }

      //   if (tagRef) {
      //     if (!descriptor.isDefUsed) {
      //       tagRef.description = tagRef.description
      //         ? tagRef.description + `\n# ${descriptor.title}`
      //         : `# ${descriptor.title}`;
      //     }

      //     if (tagRef.description.length) {
      //       tagRef.description += '\n';
      //     }

      //     if (descriptor.description?.length) {
      //       tagRef.description += descriptor.description.join('\n');
      //     }
      //   }
      // }

      if (!descriptor.api) {
        return;
      }

      const url = new URL(parserUtils.addUriDefaultScheme(descriptor.api.endpoint));
      const protocolScheme = url.protocol === 'scheme:' ? 'http' : url.protocol.slice(0, -1);
      const protocolHost = url.host === 'domain' ? '{{domain}}' : url.host;
      const protocolPath = url.pathname.replace(/:(\w+)/g, (_, p) => `{{${p}}}`) + url.search.replace(/:(\w+)/g, (_, p) => `{{${p}}}`);
      const root = url.protocol === 'scheme:' && url.host === 'domain'
        ? `{{domain}}${url.port ? ':' + url.port : ''}`
        : `${protocolScheme}://${protocolHost}${url.port ? ':' + url.port : ''}`;

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
          method: descriptor.api.transport.method,
          url: {
            raw: `${root}${protocolPath}${url.hash}`,
            protocol: protocolScheme,
            host: protocolHost.split('.'),
            port: url.port || undefined,
            path: protocolPath?.split('/').slice(1),
            query: [],
          },
        },
      };

      rootItem.push(item);

      if (descriptor.queryGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.queryGroupVariant)[0];

        if (groupVariantKey) {
          const sampleBody = convertParamGroupVariantToSampleBody(
            descriptor.queryGroupVariant[groupVariantKey].prop,
            descriptor.query,
            { primitiveValueAsParam: true },
          );

          item.request.url.query = Object.entries(sampleBody).map(([ key, value ]) => {
            const description = value instanceof SampleParam ? value.description : undefined;
            const type = value instanceof SampleParam ? value.type : 'text';

            return {
              key,
              value: JSON.stringify(value),
              description,
              // type,
            };
          })
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
                  const description = value instanceof SampleParam ? value.description : undefined;
                  const type = value instanceof SampleParam ? value.type : 'text';

                  return {
                    key,
                    value: JSON.stringify(value),
                    description,
                    type,
                  };
                }),
              };
              break;
          }
        }
      }

      // throw 3;

      // const uriParams = {};
      // const responses = {};

      // parserOpenAPIUtils.enumUriPlaceholders(endpoint, (placeholder, isInQuery) => {
      //   uriParams[placeholder] = isInQuery;
      // });

      // if (!descriptor.api.transport.method) {
      //   descriptor.api.transport.method = 'post';
      // }

      // const methodDescriptor = spec.paths[endpoint][descriptor.api.transport.method] = {
      //   summary: descriptor.title,
      //   operationId: descriptor.id,
      //   responses,
      // };

      // if (descriptor.description) {
      //   methodDescriptor.description = descriptor.description.join('\n');
      // }

      // if (descriptor.chapter?.name || descriptor.group?.name || descriptor?.subgroup?.name) {
      //   methodDescriptor.tags = [];

      //   const [ name, description ] = getTagNameAndDescription(descriptor);

      //   if (name && !tagsInitialized[name]) {
      //     tags[name] = { name, description: tags[name]?.description ? `${description}\n${tags[name]?.description}` : description };
      //     tagsInitialized[name] = true;
      //   }

      //   if (name) {
      //     methodDescriptor.tags.push(name);
      //   }
      // }

      // if (Object.keys(descriptor.authCookieGroupVariant ?? {})[0] && !spec.components.securitySchemes) {
      //   spec.components.securitySchemes = {};
      // }

      // if (Object.keys(descriptor.authHeaderGroupVariant ?? {})[0] && !spec.components.securitySchemes) {
      //   spec.components.securitySchemes = {};
      // }

      // if (Object.keys(descriptor.authParamGroupVariant ?? {})[0] && !spec.components.securitySchemes) {
      //   spec.components.securitySchemes = {};
      // }

      // if (Object.keys(descriptor.authQueryGroupVariant ?? {})[0] && !spec.components.securitySchemes) {
      //   spec.components.securitySchemes = {};
      // }

      // if (descriptor.authCookieGroupVariant) {
      //   const groupVariantKey = Object.keys(descriptor.authCookieGroupVariant)[0];

      //   if (groupVariantKey) {
      //     if (!methodDescriptor.security) {
      //       methodDescriptor.security = [];
      //     }

      //     descriptor.authCookieGroup[groupVariantKey].list.forEach((authCookieIndex) => {
      //       const authCookie = descriptor.authCookie[authCookieIndex];
      //       methodDescriptor.security.push({ [authCookie.group || 'default']: [] });

      //       switch (authCookie.type.modifiers.initial) {
      //         case 'apikey':
      //           spec.components.securitySchemes[authCookie.group || 'default'] = { type: 'apiKey', in: 'cookie', name: authCookie.field.name };
      //           break;

      //         case 'basic':
      //         case 'bearer':
      //           spec.components.securitySchemes[authCookie.group || 'default'] = { type: 'http', scheme: authCookie.type.modifiers.initial, name: authCookie.field.name };
      //           break;
      //       }
      //     });
      //   }
      // }

      // if (descriptor.authHeaderGroupVariant) {
      //   const groupVariantKey = Object.keys(descriptor.authHeaderGroupVariant)[0];

      //   if (groupVariantKey) {
      //     if (!methodDescriptor.security) {
      //       methodDescriptor.security = [];
      //     }

      //     descriptor.authHeaderGroup[groupVariantKey].list.forEach((authHeaderIndex) => {
      //       const authHeader = descriptor.authHeader[authHeaderIndex];
      //       methodDescriptor.security.push({ [authHeader.group || 'default']: [] });

      //       switch (authHeader.type.modifiers.initial) {
      //         case 'apikey':
      //           spec.components.securitySchemes[authHeader.group || 'default'] = { type: 'apiKey', in: 'header', name: authHeader.field.name };
      //           break;

      //         case 'basic':
      //         case 'bearer':
      //           spec.components.securitySchemes[authHeader.group || 'default'] = { type: authHeader.type.modifiers.initial, name: authHeader.field.name };
      //           break;
      //       }
      //     });
      //   }
      // }

      // if (descriptor.authParamGroupVariant) {
      //   const groupVariantKey = Object.keys(descriptor.authParamGroupVariant)[0];

      //   if (groupVariantKey) {
      //     if (!methodDescriptor.security) {
      //       methodDescriptor.security = [];
      //     }

      //     descriptor.authParamGroup[groupVariantKey].list.forEach((authParamIndex) => {
      //       const authParam = descriptor.authParam[authParamIndex];
      //       methodDescriptor.security.push({ [authParam.group || 'default']: [] });

      //       switch (authParam.type.modifiers.initial) {
      //         case 'apikey':
      //           spec.components.securitySchemes[authParam.group || 'default'] = { type: 'apiKey', in: uriParams[param.field.name] === false ? 'path' : 'query', name: authParam.field.name };
      //           break;

      //         case 'basic':
      //         case 'bearer':
      //           spec.components.securitySchemes[authParam.group || 'default'] = { type: 'http', scheme: authParam.type.modifiers.initial, name: authParam.field.name };
      //           break;
      //       }
      //     });
      //   }
      // }

      // if (descriptor.authQueryGroupVariant) {
      //   const groupVariantKey = Object.keys(descriptor.authQueryGroupVariant)[0];

      //   if (groupVariantKey) {
      //     if (!methodDescriptor.security) {
      //       methodDescriptor.security = [];
      //     }

      //     descriptor.authQueryGroup[groupVariantKey].list.forEach((authQueryIndex) => {
      //       const authQuery = descriptor.authParam[authQueryIndex];
      //       methodDescriptor.security.push({ [authQuery.group || 'default']: [] });

      //       switch (authQuery.type.modifiers.initial) {
      //         case 'apikey':
      //           spec.components.securitySchemes[authQuery.group || 'default'] = { type: 'apiKey', in: 'query', name: authQuery.field.name };
      //           break;

      //         case 'basic':
      //         case 'bearer':
      //           spec.components.securitySchemes[authQuery.group || 'default'] = { type: 'http', scheme: authQuery.type.modifiers.initial, name: authQuery.field.name };
      //           break;
      //       }
      //     });
      //   }
      // }

      // if (Object.keys(descriptor.cookieGroupVariant ?? {})[0] && !methodDescriptor.parameters) {
      //   methodDescriptor.parameters = [];
      // }

      // if (Object.keys(descriptor.paramGroupVariant ?? {})[0] && !methodDescriptor.parameters) {
      //   methodDescriptor.parameters = [];
      // }

      // if (Object.keys(descriptor.queryGroupVariant ?? {})[0] && !methodDescriptor.parameters) {
      //   methodDescriptor.parameters = [];
      // }

      // if (Object.keys(descriptor.headerGroupVariant ?? {})[0] && !methodDescriptor.parameters) {
      //   methodDescriptor.parameters = [];
      // }

      // if (descriptor.cookieGroupVariant) {
      //   const groupVariantKey = Object.keys(descriptor.cookieGroupVariant)[0];

      //   if (groupVariantKey) {
      //     schema = maybeReplaceObjectParamsWithRef(
      //       parserUtils.convertParamGroupVariantToJsonSchema(
      //         descriptor.cookieGroupVariant[groupVariantKey].prop,
      //         descriptor.cookie,
      //         undefined,
      //         { newNullable: SCHEMA_NEW_NULLABLE },
      //       ),
      //       schemas,
      //       compressionDepth,
      //     );

      //     methodDescriptor.parameters = methodDescriptor.parameters.concat(Object.entries(schema.properties ?? {}).map(([ key, keySchema ]) => {
      //       return {
      //         name: key,
      //         in: 'cookie',
      //         description: keySchema.description,
      //         required: !!schema.required?.includes(key),
      //         schema: keySchema,
      //       };
      //     }));
      //   }
      // }

      // if (descriptor.headerGroupVariant) {
      //   const groupVariantKey = Object.keys(descriptor.headerGroupVariant)[0];

      //   if (groupVariantKey) {
      //     schema = maybeReplaceObjectParamsWithRef(
      //       parserUtils.convertParamGroupVariantToJsonSchema(
      //         descriptor.headerGroupVariant[groupVariantKey].prop,
      //         descriptor.header,
      //         undefined,
      //         { newNullable: SCHEMA_NEW_NULLABLE },
      //       ),
      //       schemas,
      //       compressionDepth,
      //     );

      //     methodDescriptor.parameters = methodDescriptor.parameters.concat(Object.entries(schema.properties ?? {}).map(([ key, keySchema ]) => {
      //       return {
      //         name: key,
      //         in: 'header',
      //         description: keySchema.description,
      //         required: !!schema.required?.includes(key),
      //         schema: keySchema,
      //       };
      //     }));
      //   }
      // }

      // if (descriptor.paramGroupVariant) {
      //   const groupVariantKey = Object.keys(descriptor.paramGroupVariant)[0];

      //   if (groupVariantKey) {
      //     const notBodyParamKeys = [];

      //     schema = maybeReplaceObjectParamsWithRef(
      //       parserUtils.convertParamGroupVariantToJsonSchema(
      //         descriptor.paramGroupVariant[groupVariantKey].prop,
      //         descriptor.param,
      //         undefined,
      //         { newNullable: SCHEMA_NEW_NULLABLE },
      //       ),
      //       schemas,
      //       compressionDepth,
      //     );

      //     for (const subSchema of schema.oneOf ? schema.oneOf : [ schema ]) {
      //       methodDescriptor.parameters = methodDescriptor.parameters.concat(Object.entries(subSchema.properties ?? {}).map(([ key, keySchema ]) => {
      //         const isQueryParam = !descriptor.queryGroupVariant?.[groupVariantKey] && (
      //           key in uriParams ||
      //           descriptor.api.transport.method === 'get' ||
      //           descriptor.api.transport.method === 'delete'
      //         );

      //         if (!isQueryParam) {
      //           return null;
      //         }

      //         notBodyParamKeys.push(key);

      //         return {
      //           name: key,
      //           in: uriParams[key] === false ? 'path' : 'query',
      //           description: keySchema.description,
      //           required: !!subSchema.required?.includes(key),
      //           schema: keySchema,
      //         };
      //       }).filter(_ => _));

      //       // not to filter, param must stay at same index
      //       const bodyParams = descriptor.param.map((param) => notBodyParamKeys.includes(param.field.name) ? null : param);

      //       if (bodyParams.filter((param) => !!param).length) {
      //         methodDescriptor.requestBody = {
      //           content: descriptor.contentType.reduce((acc, contentType) => {
      //             schema = maybeReplaceObjectParamsWithRef(
      //               parserUtils.convertParamGroupVariantToJsonSchema(
      //                 descriptor.paramGroupVariant[groupVariantKey].prop,
      //                 bodyParams,
      //                 undefined,
      //                 { newNullable: SCHEMA_NEW_NULLABLE },
      //               ),
      //               schemas,
      //               compressionDepth,
      //             );

      //             const encoding = schema?.properties ? Object.entries(schema.properties).reduce((acc, [key, value]) => {
      //               if (value?.type === 'object' && value?.properties) {
      //                 acc[key] = {
      //                   contentType: 'application/json',
      //                 };
      //               }

      //               return acc;
      //             }, {}) : undefined;

      //             acc[CONTENT_TYPE_TO_OPENAPI_CONTENT_TYPE[contentType]] = {
      //               schema,
      //               encoding,
      //             };
      
      //             return acc;
      //           }, {}),
      //         };
      //       }
      //     }
      //   }
      // }

      // if (descriptor.queryGroupVariant) {
      //   const groupVariantKey = Object.keys(descriptor.queryGroupVariant)[0];

      //   if (groupVariantKey) {
      //     schema = maybeReplaceObjectParamsWithRef(
      //       parserUtils.convertParamGroupVariantToJsonSchema(
      //         descriptor.queryGroupVariant[groupVariantKey].prop,
      //         descriptor.query,
      //         undefined,
      //         { newNullable: SCHEMA_NEW_NULLABLE },
      //       ),
      //       schemas,
      //       compressionDepth,
      //     );

      //     methodDescriptor.parameters = methodDescriptor.parameters.concat(Object.entries(schema.properties ?? {}).map(([ key, keySchema ]) => {
      //       return {
      //         name: key,
      //         in: uriParams[key] === false ? 'path' : 'query',
      //         description: keySchema.description,
      //         required: !!schema.required?.includes(key),
      //         schema: keySchema,
      //       };
      //     }));
      //   }
      // }

      // if (!descriptor.successGroupVariant && !descriptor.errorGroupVariant) {
      //   responses['default'] = { description: 'No response' };
      // } else {
      //   for (const contentType of descriptor.successContentType || descriptor.contentType) {
      //     if (descriptor.successGroupVariant) {
      //       Object.entries(descriptor.successGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
      //         let schema = maybeReplaceObjectParamsWithRef(
      //           parserUtils.convertParamGroupVariantToJsonSchema(
      //             groupVariant.prop,
      //             descriptor.success,
      //             undefined,
      //             { newNullable: SCHEMA_NEW_NULLABLE },
      //           ),
      //           schemas,
      //           compressionDepth,
      //         );
      //         const responseKey = groupVariantKey === 'null' ? '200' : /^\d\d\d$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`;
      //         const contentTypeKey = CONTENT_TYPE_TO_OPENAPI_CONTENT_TYPE[contentType];

      //         if (responses[responseKey]?.content?.[contentTypeKey]) {
      //           const oldShema = responses[responseKey].content[contentTypeKey].schema;

      //           if (!oldShema?.oneOf) {
      //             responses[responseKey].content[contentTypeKey].schema = {
      //               oneOf: [ oldShema ],
      //             };
      //           }

      //           if (schema.oneOf) {
      //             responses[responseKey].content[contentTypeKey].schema.oneOf.push(...schema.oneOf);
      //           } else {
      //             responses[responseKey].content[contentTypeKey].schema.oneOf.push(schema);
      //           }

      //           schema = responses[responseKey].content[contentTypeKey].schema;
      //         }

      //         if (!responses[responseKey]) {
      //           responses[responseKey] = { description: 'No description', content: {} };
      //         }

      //         let oldSchema = responses[responseKey]?.content?.[CONTENT_TYPE_TO_OPENAPI_CONTENT_TYPE[contentType]]?.schema;

      //         if (oldSchema) {
      //           oldSchema = { $oneOf: oldSchema.$oneOf ? oldSchema.$oneOf : [ oldSchema ] };
      //           oldSchema.$oneOf.push(schema);
      //         } else {
      //           oldSchema = schema;
      //         }

      //         set(responses[responseKey], `content.${CONTENT_TYPE_TO_OPENAPI_CONTENT_TYPE[contentType]}.schema`, oldSchema);
      //       });
      //     }
      //   }

      //   for (const contentType of descriptor.errorContentType || descriptor.contentType) {
      //     if (descriptor.errorGroupVariant) {
      //       Object.entries(descriptor.errorGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
      //         let schema = maybeReplaceObjectParamsWithRef(
      //           parserUtils.convertParamGroupVariantToJsonSchema(
      //             groupVariant.prop,
      //             descriptor.error,
      //             undefined,
      //             { newNullable: SCHEMA_NEW_NULLABLE },
      //           ),
      //           schemas,
      //           compressionDepth,
      //         );
      //         const responseKey = groupVariantKey === 'null' ? '500' : /^\d\d\d?$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`;
      //         const contentTypeKey = CONTENT_TYPE_TO_OPENAPI_CONTENT_TYPE[contentType];

      //         if (responses[responseKey]?.content?.[contentTypeKey]) {
      //           const oldShema = responses[responseKey].content[contentTypeKey].schema;

      //           if (!oldShema?.oneOf) {
      //             responses[responseKey].content[contentTypeKey].schema = {
      //               oneOf: [ oldShema ],
      //             };
      //           }

      //           if (schema.oneOf) {
      //             responses[responseKey].content[contentTypeKey].schema.oneOf.push(...schema.oneOf);
      //           } else {
      //             responses[responseKey].content[contentTypeKey].schema.oneOf.push(schema);
      //           }

      //           schema = responses[responseKey].content[contentTypeKey].schema;
      //         }

      //         if (!responses[responseKey]) {
      //           responses[responseKey] = { description: 'No description', content: {} };
      //         }

      //         let oldSchema = responses[responseKey]?.content?.[CONTENT_TYPE_TO_OPENAPI_CONTENT_TYPE[contentType]]?.schema;

      //         if (oldSchema) {
      //           oldSchema = { $oneOf: oldSchema.$oneOf ? oldSchema.$oneOf : [ oldSchema ] };
      //           oldSchema.$oneOf.push(schema);
      //         } else {
      //           oldSchema = schema;
      //         }

      //         set(responses[responseKey], `content.${CONTENT_TYPE_TO_OPENAPI_CONTENT_TYPE[contentType]}.schema`, oldSchema);
      //       });
      //     }
      //   }
      // }
    });

    // if (Object.keys(tags).length) {
    //   spec.tags = Object.values(tags);
    // }

    // if (Object.keys(schemas).length) {
    //   spec.components.schemas = schemas;
    // }

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

// const schemaRefsShorten = {
//   $: 1,
// };
// const schemaRefsToReplaceOnMoreThanOne = {

// };
// const schemaRefsShortenIdUsed = new Set();

// function maybeReplaceObjectParamsWithRefIsComplexDef(obj) {
//   if (obj?.type === 'object' || obj?.enum) {
//     return true;
//   }

//   if (obj?.type === 'array') {
//     return obj.items?.type === 'object' || obj.items?.enum;
//   }

//   return false;
// }

// function maybeReplaceObjectParamsWithRef(obj, schemaRefs, depth = 2) {
//   if (depth < 1 || !maybeReplaceObjectParamsWithRefIsComplexDef(obj)) {
//     return obj;
//   }

//   let props = obj.properties ?? obj.items?.properties;

//   Object.entries(props ?? {}).forEach(([ key, val ]) => {
//     if (maybeReplaceObjectParamsWithRefIsComplexDef(val)) {
//       if (val && typeof val === 'object') {
//         maybeReplaceObjectParamsWithRef(val, schemaRefs, depth - 1);
//       }

//       const hash = computeHash(val);

//       let refShortenId;

//       if (!schemaRefsShorten[hash]) {
//         if (!schemaRefsToReplaceOnMoreThanOne[hash] || schemaRefsToReplaceOnMoreThanOne[hash][0] === props) {
//           schemaRefsToReplaceOnMoreThanOne[hash] = [ props, key ];

//           return;
//         }

//         let refShortenIdExtra = '';

//         if (val.description) {
//           refShortenIdExtra = `_${val.description.split('\n')[0].split('.')[0].trim().replace(/[^\p{L}]+/gu, '_').toLowerCase()}`;
//         }

//         refShortenId = `schema_${schemaRefsShorten.$}${refShortenIdExtra}`;

//         if (schemaRefsShortenIdUsed.has(refShortenId)) {
//           refShortenId = `schema_${schemaRefsShorten.$ += 1}${refShortenIdExtra}`;
//         }

//         schemaRefsShortenIdUsed.add(refShortenId);

//         const [ ref, refKey ] = schemaRefsToReplaceOnMoreThanOne[hash];

//         ref[refKey] = { $ref: `#/components/schemas/${refShortenId}` };
//       } else {
//         refShortenId = schemaRefsShorten[hash];
//       }

//       schemaRefsShorten[hash] = refShortenId;
//       schemaRefs[refShortenId] = val;
//       props[key] = { $ref: `#/components/schemas/${refShortenId}` };
//     }
//   });

//   return obj;
// }

// function getTagNameAndDescription(descriptor) {
//   if (descriptor.subgroup?.title) {
//     return [
//       [ descriptor.chapter.title, descriptor.group.title, descriptor.subgroup?.title ].filter((e) => !!e).join(' / '),
//       [ ...descriptor.chapter.description, ...descriptor.group.description, ...descriptor.subgroup.description ].join('\n'),
//     ];
//   }
  
//   if (descriptor.group?.title) {
//     return [
//       [ descriptor.chapter.title, descriptor.group.title ].filter((e) => !!e).join(' / '),
//       [ ...descriptor.chapter.description, ...descriptor.group.description ].join('\n'),
//     ];
//   }
  
//   if (descriptor.chapter?.title) {
//     return [
//       descriptor.chapter.title,
//       descriptor.chapter.description.join('\n'),
//     ];
//   }

//   return [ null, null ];
// }

// function isPrimitiveValue(value) {
//   return value === null || typeof value !== 'object';
// }

// function computeHash(obj) {
//   const pairs = [];

//   computeHashInternal(obj, '', pairs);

//   return createHash('sha256').update(pairs.join('|')).digest('hex');
// }

// function computeHashInternal(val, sub = '', pairs = []) {
//   if (Array.isArray(val)) {
//     Array.from(val).sort().forEach((val, ind) => {
//       if (isPrimitiveValue(val)) {
//         pairs.push(`${sub}${ind}=${val}`);
//       } else {
//         computeHashInternal(val, `${sub}.${ind}`, pairs);
//       }
//     });
//   } else if (!isPrimitiveValue(val)) {
//     Object.keys(val).sort().forEach((key) => {
//       if (isPrimitiveValue(val[key])) {
//         pairs.push(`${sub}${key}=${val[key]}`);
//       } else {
//         computeHashInternal(val[key], `${sub}.${key}`, pairs);
//       }
//     });
//   } else {
//     pairs.push(`${sub}=${val}`);
//   }
// }

const TYPE_TO_DEFAULT_VALUE = {
  boolean: () => true,
  date: (opts) => opts.now.slice(0, 10),
  datetime: (opts) => opts.now,
  'date-time': (opts) => opts.now,
  email: () => 'example@exmaple.com',
  file: () => new SampleParamFile(),
  hostname: () => 'example.com',
  id: () => 1,
  int32: () => 0,
  int64: () => 0,
  integer: () => 0,
  ipv4: () => '1.2.3.4',
  ipv6: () => '::1',
  latitude: () => 51.477928,
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

class SampleParam {
  get type() {
    return null;
  }

  contructior(value, description) {
    this.destriction = description;
    this.value = value;
  }

  toJSON() {
    return this.valueOf();
  }

  valueOf() {
    return this.value;
  }
}

class SampleParamFile extends SampleParam {
  get type() {
    return 'file';
  }

  valueOf() {
    return this.value ?? './sample';
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

    let paramValue = param.field.defaultValud !== undefined
      ? param.field.defaultValue
      : param.type?.allowedValues?.[0] ?? TYPE_TO_DEFAULT_VALUE[param.type?.modifiers?.initial]?.(opts) ?? null;

    if (opts?.primitiveValueAsParam && !param.type?.modifiers?.object) {
      paramValue = new SampleParam(paramValue, param.description?.join('\n'));
    }

    set(sample, paramPath, paramValue);
    convertParamGroupVariantToSampleBody(propVariants[0].prop, paramDescriptors, opts, paramPath, sample);
  });

  return sample;
}
