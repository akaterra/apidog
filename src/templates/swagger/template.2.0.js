const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserSwaggerUtils = require('../../parser.swagger.utils');
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

      if (!descriptor.successsGroups && !descriptor.errorsGroups) {
        responses['default'] = {description: 'No description'};
      } else {
        if (descriptor.successsGroups) {
          Object.entries(descriptor.successsGroups).forEach(([key, params]) => {
            responses[key === '$' ? 'default' : /^\d\d\d$/.test(key) ? key : `x-${key}`] = {
              description: 'No description',
              schema: parserUtils.convertParamsToJsonSchema(params.list),
            };
          });
        }

        if (descriptor.errorsGroups) {
          Object.entries(descriptor.errorsGroups).forEach(([key, params]) => {
            responses[key === '$' ? 'default' : /^\d\d\d$/.test(key) ? key : `x-${key}`] = {
              description: 'No description',
              schema: parserUtils.convertParamsToJsonSchema(params.list),
            };
          });
        }
      }

      let isBodyParamInitiated = false;

      if (!descriptor.api.transport.method) {
        descriptor.api.transport.method = 'get';
      }

      spec.paths[endpoint][descriptor.api.transport.method] = {
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
        parameters: descriptor.params.map((param) => {
          const typeAllowedValues = param.type.allowedValues.filter(_ => _);

          if (param.field.name in uriParams || descriptor.api.transport.method === 'get') {
            return {
              name: param.field.name,
              in: uriParams[param.field.name] === false ? 'path' : 'query',
              description: param.description && param.description.join('/n'),
              required: !param.field.isOptional,
              type: param.type.modifiers.initial.toLowerCase(),
              enum: typeAllowedValues.length ? typeAllowedValues : undefined,
            };
          }

          if (isBodyParamInitiated) {
            return null;
          }

          isBodyParamInitiated = true;

          return {
            name: 'body',
            in: 'body',
            description: '',
            required: true,
            schema: parserUtils.convertParamsToJsonSchema(descriptor.params.filter((param) => !(param.field.name in uriParams))),
            enum: typeAllowedValues.length ? typeAllowedValues : undefined,
          };
        }).filter((parameter) => parameter),
        responses,
      };
    });

    fs.writeFileSync(`${outputDir}/swagger2.json`, JSON.stringify(spec, undefined, 2));
  },
});
