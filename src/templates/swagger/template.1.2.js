const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserSwaggerUtils = require('../../parser.swagger.utils');
const URL = require('url').URL;

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;

    const spec = {
      swaggerVersion: '1.2',
      info: {
        title: params.title,
        description: params.description,
      },
      apiVersion: params.version,
      basePath: '/',
      consumes: Object.values(params.contentTypes).map((contentType) => {
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
      produces: Object.values(params.contentTypes).map((contentType) => {
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
      apis: [],
      models: {},
    };

    const apis = {};

    let modelBodyId = 1;

    parserUtils.enumChapters(params.chapters, ({descriptor}) => {
      const endpoint = new URL(parserUtils.addUriDefaultScheme(descriptor.api.endpoint)).pathname.replace(/:(\w+)/g, (_, p) => `{${p}}`);

      if (!(endpoint in apis)) {
        apis[endpoint] = {
          path: endpoint,
          operations: [],
        };
      }

      const uriParams = {};

      parserSwaggerUtils.enumUriPlaceholders(endpoint, (placeholder, isInQuery) => {
        uriParams[placeholder] = isInQuery;
      });

      const responses = [];

      if (descriptor.successsGroups) {
        Object.entries(descriptor.successsGroups).forEach(([key, params]) => {
          responses.push({
            code: key,
            message: 'No description',
            responseModel: '???',
          });
        });
      }

      if (descriptor.errorsGroups) {
        Object.entries(descriptor.errorsGroups).forEach(([key, params]) => {
          responses.push({
            code: key,
            message: 'No description',
            responseModel: '???',
          });
        });
      }

      let isBodyParamInitiated = false;

      apis[endpoint].operations.push({
        method: descriptor.api.transport.method || 'get',
        summary: descriptor.title,
        notes: descriptor.description && descriptor.description.join('\n'),
        nickname: descriptor.id,
        parameters: descriptor.params.map((param) => {
          if (param.field.name in uriParams) {
            return {
              name: param.field.name,
              paramType: uriParams[param.field.name] ? 'query' : 'path',
              description: param.description && param.description.join('/n'),
              required: !param.field.isOptional,
              type: param.type.name.toLowerCase(),
            }
          }

          if (isBodyParamInitiated) {
            return null;
          }

          isBodyParamInitiated = true;

          spec.models[`Body${modelBodyId}`] = {
            id: `Body${modelBodyId}`,
            properties: parserUtils.convertParamsToJsonSchema(descriptor.params.filter((param) => !(param.field.name in uriParams)))
          };

          modelBodyId += 1;

          return {
            name: 'body',
            paramType: 'body',
            description: '',
            required: true,
            type: `Body${modelBodyId - 1}`,
          };
        }).filter((parameter) => parameter),
        responseMessages: responses,
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
        deprecated: descriptor.deprecated ? 'true' : 'false',
      });
    });

    spec.apis = Object.values(apis);

    fs.writeFileSync(`${outputDir}/swagger.1.2.json`, JSON.stringify(spec, undefined, 2));
  },
});
