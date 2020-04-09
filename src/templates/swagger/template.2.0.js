const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserSwaggerUtils = require('../../parser.swagger.1.2.utils');
const URL = require('url').URL;

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;

    const spec = {
      swagger: '2.0',
      info: {
        title: params.title,
        description: params.description,
        version: params.version,
      },
      basePath: '/',
      schemes: Object.values(params.schemes).map((scheme) => {
        switch (scheme) {
          case 'websocket':
            return 'ws';

          case 'websocketsequre':
            return 'wss';
        }

        return scheme;
      }),
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
              schema: parserUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.success),
            };
          });
        }

        if (descriptor.errorGroupVariant) {
          Object.entries(descriptor.errorGroupVariant).forEach(([groupVariantKey, groupVariant]) => {
            responses[groupVariantKey === 'null' ? 'default' : /^\d\d\d$/.test(groupVariantKey) ? groupVariantKey : `x-${groupVariantKey}`] = {
              description: 'No description',
              schema: parserUtils.convertParamGroupVariantToJsonSchema(groupVariant.prop, descriptor.error),
            };
          });
        }
      }

      let isBodyParamInitiated = false;

      if (!descriptor.api.transport.method) {
        descriptor.api.transport.method = 'post';
      }

      const methodDescriptor = spec.paths[endpoint][descriptor.api.transport.method] = {
        summary: descriptor.title,
        description: descriptor.description && descriptor.description.join('\n'),
        operationId: descriptor.id,
        consumes: descriptor.contentType.map((contentType) => {
          switch (contentType) {
            case 'form':
              return 'application/x-www-form-urlencoded';

            case 'json':
              return 'application/json';

            case 'xml':
              return 'application/xml';
          }

          return contentType;
        }),
        produces: descriptor.contentType.map((contentType) => {
          switch (contentType) {
            case 'form':
              return 'application/x-www-form-urlencoded';

            case 'json':
              return 'application/json';

            case 'xml':
              return 'application/xml';
          }

          return contentType;
        }),
        responses,
      };

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
                ...parserUtils.convertParamTypeToJsonSchema(param.type.modifiers.initial.toLowerCase()),
                enum: param.type.allowedValues.length
                  ? param.type.allowedValues
                  : undefined,
              };
            }

            return null;
          }).filter(_ => _);

          const bodyParams = descriptor.param.map((param, index) => notBodyParamIndexes.includes(index) ? null : param);

          if (bodyParams.length) {
            methodDescriptor.parameters.push({
              name: 'body',
              in: 'body',
              description: '',
              required: true,
              schema: parserUtils.convertParamGroupVariantToJsonSchema(
                descriptor.paramGroupVariant[groupVariantKey].prop,
                bodyParams,
              ),
            });
          }
        }
      }
    });

    const content = JSON.stringify(spec, undefined, 2);

    if (outputDir === 'stdout') {
      return content;
    } else {
      fs.writeFileSync(`${outputDir}/swagger.2.0.json`, JSON.stringify(spec, undefined, 2));
    }
  },
});
