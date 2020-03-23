const fs = require('fs');
const parserUtils = require('../../parser.utils');
const parserSwaggerUtils = require('../../parser.swagger.1.2.utils');
const URL = require('url').URL;

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;

    const spec = {
      openapi: '3.0.3',
      info: {
        title: params.title,
        description: params.description,
        version: params.version,
      },
      servers: [{
        url: '/',
      }],
      // schemes: Object.values(params.schemes).map((scheme) => {
      //   switch (scheme) {
      //     case 'websocket':
      //       return 'ws';

      //     case 'websocketsequre':
      //       return 'wss';
      //   }

      //   return scheme;
      // }),
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
              content: {
                '*/*': {
                  schema: parserUtils.convertParamsToJsonSchema(params.list),
                },
              },
            };
          });
        }

        if (descriptor.errorGroup) {
          Object.entries(descriptor.errorGroup).forEach(([key, params]) => {
            responses[key === '$' ? 'default' : /^\d\d\d$/.test(key) ? key : `x-${key}`] = {
              description: 'No description',
              content: {
                '*/*': {
                  schema: parserUtils.convertParamsToJsonSchema(params.list),
                },
              },
            };
          });
        }
      }

      let bodyParam = null;

      if (!descriptor.api.transport.method) {
        descriptor.api.transport.method = 'post';
      }

      const methodDescriptor = spec.paths[endpoint][descriptor.api.transport.method] = {
        summary: descriptor.title,
        description: descriptor.description && descriptor.description.join('\n'),
        operationId: descriptor.id,
        // consumes: descriptor.contentType.map((contentType) => {
        //   switch (contentType) {
        //     case 'form':
        //       return 'application/x-www-form-urlencoded';

        //     case 'json':
        //       return 'application/json';

        //     case 'xml':
        //       return 'application/xml';
        //   }

        //   return contentType;
        // }),
        // produces: descriptor.contentType.map((contentType) => {
        //   switch (contentType) {
        //     case 'form':
        //       return 'application/x-www-form-urlencoded';

        //     case 'json':
        //       return 'application/json';

        //     case 'xml':
        //       return 'application/xml';
        //   }

        //   return contentType;
        // }),
        parameters: descriptor.param.map((param) => {
          const typeAllowedValues = param.type.allowedValues.filter(_ => _);

          if (param.field.name in uriParams || descriptor.api.transport.method === 'get') {
            return {
              name: param.field.name,
              in: uriParams[param.field.name] === false ? 'path' : 'query',
              description: param.description && param.description.join('/n'),
              required: !param.field.isOptional,
              schema: {
                ...parserUtils.convertSimpleTypeToJsonSchema(param.type.modifiers.initial.toLowerCase()),
                enum: typeAllowedValues.length ? typeAllowedValues : undefined,
              },
            };
          }

          if (bodyParam) {
            return null;
          }

          bodyParam =  {
            name: 'body',
            in: 'body',
            description: '',
            required: true,
            schema: parserUtils.convertParamsToJsonSchema(descriptor.param.filter((param) => !(param.field.name in uriParams))),
            enum: typeAllowedValues.length ? typeAllowedValues : undefined,
          };

          return null;
        }).filter((parameter) => parameter),
        responses,
      };

      if (bodyParam) {
        methodDescriptor.requestBody = {
          content: descriptor.contentType.reduce((acc, contentType) => {
            switch (contentType) {
              case 'form':
                acc['application/x-www-form-urlencoded'] = { schema: bodyParam.schema };

                break;

              case 'json':
                acc['application/json'] = { schema: bodyParam.schema };

                break;

              case 'xml':
                acc['application/xml'] = { schema: bodyParam.schema };

                break;
            }

            return acc;
          }, {}),
        };
      }
    });

    const content = JSON.stringify(spec, undefined, 2);

    if (outputDir === 'stdout') {
      return content;
    } else {
      fs.writeFileSync(`${outputDir}/swagger.3.0.json`, JSON.stringify(spec, undefined, 2));
    }
  },
});
