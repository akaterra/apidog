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

      if (!descriptor.successGroup && !descriptor.errorGroup) {
        responses['default'] = {description: 'No description'};
      } else {
        if (descriptor.successGroup) {
          Object.entries(descriptor.successGroup).forEach(([key, params]) => {
            responses[key === '$' ? 'default' : /^\d\d\d$/.test(key) ? key : `x-${key}`] = {
              description: 'No description',
              schema: parserUtils.convertParamsToJsonSchema(params.list),
            };
          });
        }

        if (descriptor.errorGroup) {
          Object.entries(descriptor.errorGroup).forEach(([key, params]) => {
            responses[key === '$' ? 'default' : /^\d\d\d$/.test(key) ? key : `x-${key}`] = {
              description: 'No description',
              schema: parserUtils.convertParamsToJsonSchema(params.list),
            };
          });
        }
      }

      let isBodyParamInitiated = false;

      if (!descriptor.api.transport.method) {
        descriptor.api.transport.method = 'post';
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
        parameters: descriptor.param.map((param) => {
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
            schema: parserUtils.convertParamsToJsonSchema(descriptor.param.filter((param) => !(param.field.name in uriParams))),
            enum: typeAllowedValues.length ? typeAllowedValues : undefined,
          };
        }).filter((parameter) => parameter),
        responses,
      };
    });

    const content = JSON.stringify(spec, undefined, 2);

    if (outputDir === 'stdout') {
      return content;
    } else {
      fs.writeFileSync(`${outputDir}/swagger.2.0.json`, JSON.stringify(spec, undefined, 2));
    }
  },
});
