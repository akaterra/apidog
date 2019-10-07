const fs = require('fs');
const handlebars = require('handlebars');

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;

    const apidocHtmlTemplate = fs.readFileSync(`${__dirname}/template.1.2.hbs`, {encoding: 'utf8'});
    fs.writeFileSync(`${outputDir}/swagger.json`, handlebars.compile(apidocHtmlTemplate)(params));
  }
});
