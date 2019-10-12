const fs = require('fs');
const handlebars = require('handlebars');
const parserUtils = require('../../parser.utils');

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;

    // const apidocHtmlTemplate = fs.readFileSync(`${__dirname}/template.2.0.hbs`, {encoding: 'utf8'});
    // fs.writeFileSync(`${outputDir}/swagger.json`, handlebars.compile(apidocHtmlTemplate)(params));

    const spec = {
      swagger: '2.0',
      info: {
        title: params.title,
        description: params.description,
        version: params.version,
      },
      basePath: '/',
      schemes: Object.values(params.schemes),
      paths: {},
    };

    parserUtils.enumChapters(params.chapters, ({descriptor}) => {
      if (!(descriptor.api.endpoint in spec.paths)) {
        spec.paths[descriptor.api.endpoint] = {};
      }

      spec.paths[descriptor.api.endpoint][descriptor.api.transport.method] = {
        summary: descriptor.title,
        description: descriptor.description,
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
        }),
      };
    });

    fs.writeFileSync(`${outputDir}/swagger2.json`, JSON.stringify(spec, undefined, 2));
  },
});
