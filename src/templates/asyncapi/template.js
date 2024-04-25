const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserOpenAPIUtils = require('../../parser.openapi.1.2.utils');
const URL = require('url').URL;

const PARAM_VALUE_BY_TYPE = {
  'Boolean': (value) => value && value !== '0' && value !== 'false' ? true : false,
  'Boolean:Enum': (value) => value && value !== '0' && value !== 'false' ? true : false,
  'Number': (value) => parseFloat(value),
  'Number:Enum': (value) => parseFloat(value),
};
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

    parserUtils.enumChapters(params.chapters, ({descriptor}) => {
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
        channelDescriptor.description = descriptor.description.join('\n');
      }

      channelDescriptor.bindings = transportProtocolConfig.bindings;

      if (transportProtocolConfig.prepareBindings) {
        channelDescriptor.bindings = transportProtocolConfig.prepareBindings(channelDescriptor.bindings, descriptor);
      }

      const messages = [];
      const replies = [];

      if (descriptor.successGroupVariant) {
        Object.entries(descriptor.successGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
          let schema;

          if (descriptor.successRootGroupVariant && descriptor.successRootGroupVariant[groupVariantKey]) {
            descriptor.success[-1] = descriptor.successRoot[0];
            schema = parserUtils.convertParamGroupVariantToJsonSchema({
              $: [ { list: [ -1 ], parent: null, prop: groupVariant.prop } ]
            }, descriptor.success).properties.$;
          } else {
            schema = parserUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.success);
          }

          if (!channelDescriptor.messages[`${groupVariantKey}_success`]) {
            channelDescriptor.messages[`${groupVariantKey}_success`] = {};
            replies.push({ $ref :`#/channels/${descriptor.id}/messages/${groupVariantKey}_success` });
          }

          channelDescriptor.messages[`${groupVariantKey}_success`].payload = schema;
        });
      }

      if (descriptor.errorGroupVariant) {
        Object.entries(descriptor.errorGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
          let schema;

          if (descriptor.errorRootGroupVariant && descriptor.errorRootGroupVariant[groupVariantKey]) {
            descriptor.error[-1] = descriptor.errorRoot[0];
            schema = parserUtils.convertParamGroupVariantToJsonSchema({
              $: [ { list: [ -1 ], parent: null, prop: groupVariant.prop } ]
            }, descriptor.error).properties.$;
          } else {
            schema = parserUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.error);
          }
          
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
          let schema;

          if (descriptor.headerRootGroupVariant?.[groupVariantKey]) {
            descriptor.header[-1] = descriptor.paramRoot[0];
            schema = parserUtils.convertParamGroupVariantToJsonSchema(
              { $: [ { list: [ -1 ], parent: null, prop: descriptor.headerGroupVariant[groupVariantKey].prop } ] },
              descriptor.header,
            ).properties.$;
          } else {
            schema = parserUtils.convertParamGroupVariantToJsonSchema(
              descriptor.headerGroupVariant[groupVariantKey].prop,
              descriptor.header,
            );
          }

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
          let schema;

          if (descriptor.paramRootGroupVariant?.[groupVariantKey]) {
            descriptor.param[-1] = descriptor.paramRoot[0];
            schema = parserUtils.convertParamGroupVariantToJsonSchema(
              { $: [ { list: [ -1 ], parent: null, prop: descriptor.paramGroupVariant[groupVariantKey].prop } ] },
              descriptor.param,
            ).properties.$;
          } else {
            schema = parserUtils.convertParamGroupVariantToJsonSchema(
              descriptor.paramGroupVariant[groupVariantKey].prop,
              descriptor.param,
            );
          }

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
      //           description: query.description && query.description.join('/n'),
      //           required: !query.field.isOptional,
      //           schema: {
      //             ...parserUtils.convertParamTypeToJsonSchema(query.type.modifiers.initial.toLowerCase()),
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

    const content = JSON.stringify(spec, undefined, 2);

    if (outputDir === 'stdout') {
      return content;
    } else {
      fs.writeFileSync(`${outputDir}/asyncapi.json`, JSON.stringify(spec, undefined, 2));
    }
  },
});
