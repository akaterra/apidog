const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserJsonSchemaUtils = require('../../parser.jsonschema.utils');
const parserOpenAPIUtils = require('../../parser.openapi.utils');
const utils = require('../../utils');
const URL = require('url').URL;
const yaml = require('js-yaml');

const PROTOCOL_CONFIG = {
  natspub: { bindings: { nats: {} }, action: 'send' },
  natssub: { bindings: { nats: {} }, action: 'receive' },
  natsrpc: { bindings: { nats: {} }, action: 'send', reply: true },
  rabbitmqpub: { bindings: { amqp: {} }, action: 'send', prepareBindings(bindings, descriptor) {
    bindings.amqp.exchange = { name: descriptor.api.transport.exchange ?? 'default', type: 'topic' };

    return bindings;
  } },
  rabbitmqsub: { bindings: { amqp: {} }, action: 'receive', prepareBindings(bindings, descriptor) {
    bindings.amqp.exchange = { name: descriptor.api.transport.exchange ?? 'default', type: 'topic' };

    return bindings;
  } },
  rabbitmqrpc: { bindings: { amqp: {} }, action: 'send', prepareBindings(bindings, descriptor) {
    bindings.amqp.exchange = { name: descriptor.api.transport.exchange ?? 'default', type: 'topic' };

    return bindings;
  }, reply: true },
  redispub: { bindings: { redis: {} }, action: 'send' },
  redissub: { bindings: { redis: {} }, action: 'receive' },
  socketio: { bindings: {  http: {} }, action: 'send', reply: true },
  websocket: { bindings: { ws: {} }, action: 'send', reply: true },
  ws: { bindings: { ws: {} }, action: 'send', reply: true },
};

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;

    const spec = {
      asyncapi: '3.0.0',
      info: {
        title: params.title,
        description: params.description,
        version: params.version,
      },
      channels: {},
      components: {},
      operations: {},
      defaultContentType: 'application/json',
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

      const transportProtocolConfig = PROTOCOL_CONFIG[descriptor.api.transport.name];

      if (!transportProtocolConfig) {
        if (config.logger) {
          config.logger.warn(`Unsupported transport "${descriptor.api.transport.name}" (${descriptor.api.endpoint})`);
        }

        return;
      }

      const url = new URL(parserUtils.addUriDefaultScheme(descriptor.api.endpoint));
      const endpoint = url.pathname.replace(/:(\w+)/g, (_, p) => `{${p}}`) + url.search.replace(/:(\w+)/g, (_, p) => `{${p}}`);
      const uriParams = {};

      parserOpenAPIUtils.enumUriPlaceholders(endpoint, (placeholder, isInQuery) => {
        uriParams[placeholder] = isInQuery;
      });

      if (!spec.channels[descriptor.id]) {
        spec.channels[descriptor.id] = {
          title: descriptor.title,
          parameters: {},
          messages: {},
        };
      }

      const channelDescriptor = spec.channels[descriptor.id];

      if (descriptor.description) {
        channelDescriptor.description = utils.joinDescription(descriptor.description, config.concatLineSymbol);
      }

      if (descriptor.chapter?.name || descriptor.group?.name || descriptor?.subgroup?.name) {
        channelDescriptor.tags = [];

        if (descriptor.subgroup?.title) {
          const name = [ descriptor.chapter.title, descriptor.group.title, descriptor.subgroup?.title ].filter((e) => !!e).join(' / ');
          tags[name] = { name, description: utils.joinDescription([ ...descriptor.chapter.description, ...descriptor.group.description, ...descriptor.subgroup.description ], config.concatLineSymbol) };
          channelDescriptor.tags.push(name);
        } else if (descriptor.group?.title) {
          const name = [ descriptor.chapter.title, descriptor.group.title ].filter((e) => !!e).join(' / ');
          tags[name] = { name, description: utils.joinDescription([ ...descriptor.chapter.description, ...descriptor.group.description ], config.concatLineSymbol) };
          channelDescriptor.tags.push(name);
        } else if (descriptor.chapter?.title) {
          const name = descriptor.chapter.title;
          tags[name] = { name, description: utils.joinDescription(descriptor.chapter.description, config.concatLineSymbol) };
          channelDescriptor.tags.push(name);
        }
      }

      channelDescriptor.bindings = transportProtocolConfig.bindings;

      if (transportProtocolConfig.prepareBindings) {
        channelDescriptor.bindings = transportProtocolConfig.prepareBindings(channelDescriptor.bindings, descriptor);
      }

      const messages = [];
      const replies = [];

      if (descriptor.successGroupVariant) {
        Object.entries(descriptor.successGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
          const schema = parserJsonSchemaUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.success);

          if (!channelDescriptor.messages[`${groupVariantKey}_success`]) {
            channelDescriptor.messages[`${groupVariantKey}_success`] = {};
            replies.push({ $ref :`#/channels/${descriptor.id}/messages/${groupVariantKey}_success` });
          }

          channelDescriptor.messages[`${groupVariantKey}_success`].payload = schema;
        });
      }

      if (descriptor.errorGroupVariant) {
        Object.entries(descriptor.errorGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
          const schema = parserJsonSchemaUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.error);

          if (!channelDescriptor.messages[`${groupVariantKey}_error`]) {
            channelDescriptor.messages[`${groupVariantKey}_error`] = {};
            replies.push({ $ref :`#/channels/${descriptor.id}/messages/${groupVariantKey}_error` });
          }

          channelDescriptor.messages[`${groupVariantKey}_error`].payload = schema;
        });
      }

      // if (Object.keys(descriptor.authHeaderGroupVariant ?? {})[0] && !spec.components.securitySchemes) {
      //   spec.components.securitySchemes = {};
      // }

      // if (Object.keys(descriptor.authParamGroupVariant ?? {})[0] && !spec.components.securitySchemes) {
      //   spec.components.securitySchemes = {};
      // }

      // if (Object.keys(descriptor.authQueryGroupVariant ?? {})[0] && !spec.components.securitySchemes) {
      //   spec.components.securitySchemes = {};
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
      //           spec.components.securitySchemes[authParam.group || 'default'] = { type: authParam.type.modifiers.initial, name: authParam.field.name };
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
      //           spec.components.securitySchemes[authQuery.group || 'default'] = { type: authQuery.type.modifiers.initial, name: authQuery.field.name };
      //           break;
      //       }
      //     });
      //   }
      // }

      // if (Object.keys(descriptor.paramGroupVariant ?? {})[0] && !channelDescriptor.parameters) {
      //   channelDescriptor.parameters = [];
      // }

      // if (Object.keys(descriptor.queryGroupVariant ?? {})[0] && !channelDescriptor.parameters) {
      //   channelDescriptor.parameters = [];
      // }

      // if (Object.keys(descriptor.headerGroupVariant ?? {})[0] && !channelDescriptor.parameters) {
      //   channelDescriptor.parameters = [];
      // }

      if (descriptor.headerGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.headerGroupVariant)[0];

        if (groupVariantKey) {
          const schema = parserJsonSchemaUtils.convertParamGroupVariantToJsonSchema(
            descriptor.headerGroupVariant[groupVariantKey].prop,
            descriptor.header,
          );

          if (!channelDescriptor.messages[groupVariantKey]) {
            channelDescriptor.messages[groupVariantKey] = {};
            messages.push({ $ref :`#/channels/${descriptor.id}/messages/${groupVariantKey}` });
          }

          channelDescriptor.messages[groupVariantKey].headers = schema;
        }
      }

      if (descriptor.paramGroupVariant) {
        const groupVariantKey = Object.keys(descriptor.paramGroupVariant)[0];

        if (groupVariantKey) {
          const schema = parserJsonSchemaUtils.convertParamGroupVariantToJsonSchema(
            descriptor.paramGroupVariant[groupVariantKey].prop,
            descriptor.param,
          );

          if (!channelDescriptor.messages[groupVariantKey]) {
            channelDescriptor.messages[groupVariantKey] = {};
            messages.push({ $ref: `#/channels/${descriptor.id}/messages/${groupVariantKey}` });
          }

          channelDescriptor.messages[groupVariantKey].payload = schema;
        }
      }

      const operationDescriptor = spec.operations[descriptor.id] = {
        title: descriptor.title,
        channel: { $ref: `#/channels/${descriptor.id}` },
        messages,
        reply: replies.length ? { messages: replies } : undefined,
      };

      if (transportProtocolConfig) {
        operationDescriptor.action = transportProtocolConfig.action;
      }

      // if (descriptor.queryGroupVariant) {
      //   const groupVariantKey = Object.keys(descriptor.queryGroupVariant)[0];

      //   if (groupVariantKey) {
      //     // const notBodyParamIndexes = [];

      //     channelDescriptor.parameters = channelDescriptor.parameters.concat(descriptor.queryGroup[groupVariantKey].list.map((queryIndex) => {
      //       const query = descriptor.query[queryIndex];

      //       if (true) {
      //         // notBodyParamIndexes.push(paramIndex);

      //         return {
      //           name: query.field.name,
      //           in: 'query',
      //           description: query.description && query.description.join('\n'),
      //           required: !query.field.isOptional,
      //           schema: {
      //             ...parserUtils.convertParamToJsonSchema(query.type.modifiers.initial.toLowerCase()),
      //             enum: query.type.allowedValues.length
      //               ? query.type.allowedValues
      //               : undefined,
      //             default: query.field.defaultValue,
      //           },
      //         };
      //       }

      //       return null;
      //     }).filter(_ => _));
      //   }
      // }
    });

    spec.tags = Object.values(tags);

    const outputFormats = config.outputFormat?.length ? config.outputFormat : [ 'json' ];

    for (const outputFormat of outputFormats) {
      let content;
      let outputName;

      switch (outputFormat) {
        case 'jsConst':
          content = `export const Spec = ${JSON.stringify(spec, undefined, 2)};`;
          outputName = 'asyncapi.js';
          break;
        case 'tsConst':
          content = `export const Spec = ${JSON.stringify(spec, undefined, 2)} as const;`;
          outputName = 'asyncapi.ts';
          break;
        case 'json':
          content = JSON.stringify(spec, undefined, 2);
          outputName = 'asyncapi.json';
          break;
        case 'yaml':
          content = yaml.dump(spec);
          outputName = 'asyncapi.yaml';
          break;  
        default:
          content = outputFormat.replace(/{{content}}/g, content);
          outputName = 'asyncapi.json';

          if (content === outputFormat) {
            throw new Error(`"{{content}}" placeholder expected for custom output format, check "outputFormat" option`);
          }
      }

      content = utils.replacePlaceholders(content, config.placeholders);

      if (outputDir === 'stdout') {
        if (outputFormats.length > 1) {
          throw new Error(`Multiple output formats are specified, but target output is a stdout, check "output" option or provide single "outputFormat" option`);
        }
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
