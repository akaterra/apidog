const fs = require('fs');
const handlebars = require('handlebars');
const uglify = require('uglify-es');

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = `${config.outputDir}/apidoc`;

    delete config.schema;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const styleCssTemplate = fs.readFileSync(`${__dirname}/assets/style.css`, {encoding: 'utf8'});
    fs.writeFileSync(`${outputDir}/style.css`, handlebars.compile(styleCssTemplate)(params));

    const apidocJsTemplate = fs.readFileSync(`${__dirname}/assets/apidoc.js`, {encoding: 'utf8'});

    if (process.env.NODE_ENV === 'test') {
      fs.writeFileSync(`${outputDir}/apidoc.min.js`, handlebars.compile(apidocJsTemplate)(params));
    } else {
      fs.writeFileSync(`${outputDir}/apidoc.min.js`, uglify.minify(handlebars.compile(apidocJsTemplate)(params)).code);
    }

    const apidocDataJsTemplate = fs.readFileSync(`${__dirname}/assets/apidoc.data.js`, {encoding: 'utf8'});

    if (process.env.NODE_ENV === 'test') {
      fs.writeFileSync(`${outputDir}/apidoc.data.min.js`, handlebars.compile(apidocDataJsTemplate)(params));
    } else {
      fs.writeFileSync(`${outputDir}/apidoc.data.min.js`, uglify.minify(handlebars.compile(apidocDataJsTemplate)(params)).code);
    }

    const apidocJsI18nTemplate = fs.readFileSync(`${__dirname}/assets/apidoc.i18n.js`, {encoding: 'utf8'});

    if (process.env.NODE_ENV === 'test') {
      fs.writeFileSync(`${outputDir}/apidoc.i18n.min.js`, handlebars.compile(apidocJsI18nTemplate)(params));
    } else {
      fs.writeFileSync(`${outputDir}/apidoc.i18n.min.js`, uglify.minify(handlebars.compile(apidocJsI18nTemplate)(params)).code);
    }

    const apidocTemplateContent = [];

    for (const templateName of [[
      'template.content', 'templateContent',
    ], [
      'template.content.param-group', 'templateContentParamGroup',
    ]]) {
      const template = fs.readFileSync(`${__dirname}/assets/${templateName[0]}.hbs`, {encoding: 'utf8'});

      apidocTemplateContent.push(`const ${templateName[1]} = \`${template}\`;`);
    }

    if (process.env.NODE_ENV === 'test') {
      fs.writeFileSync(`${outputDir}/apidoc.template.min.js`, apidocTemplateContent.join('\n'));
    } else {
      fs.writeFileSync(`${outputDir}/apidoc.template.min.js`, uglify.minify(apidocTemplateContent.join('\n')).code);
    }

    const apidocHtmlTemplate = fs.readFileSync(`${__dirname}/template.hbs`, {encoding: 'utf8'});
    fs.writeFileSync(`${outputDir}/apidoc.html`, handlebars.compile(apidocHtmlTemplate)(params));

    const handlebarsJs = fs.readFileSync(`${__dirname}/../../../node_modules/handlebars/dist/handlebars.min.js`, {encoding: 'utf8'});
    fs.writeFileSync(`${outputDir}/handlebars.min.js`, handlebarsJs);

    const favicon = fs.readFileSync(`${__dirname}/assets/favicon.ico`);
    fs.writeFileSync(`${outputDir}/favicon.ico`, favicon);
  }
});
