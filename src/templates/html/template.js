const fs = require('fs');
const handlebars = require('handlebars');
const uglify = require('uglify-es');

module.exports = (outputDir) => (hbs, config, params) => {
  const styleCssTemplate = fs.readFileSync(`${__dirname}/assets/part.style.css.hbs`, {encoding: 'utf8'});

  fs.writeFileSync(`${outputDir}/style.css`, handlebars.compile(styleCssTemplate)(params));

  const apidocJsTemplate = fs.readFileSync(`${__dirname}/assets/part.apidoc.js.hbs`, {encoding: 'utf8'});

  fs.writeFileSync(`${outputDir}/apidoc.min.js`, uglify.minify(handlebars.compile(apidocJsTemplate)(params)).code);

  const template = fs.readFileSync(`${__dirname}/assets/part.template.hbs`, {encoding: 'utf8'});

  fs.writeFileSync(`${outputDir}/apidoc.template.min.js`, uglify.minify(`templateContent = \`${template}\``).code);

  const apidocHtmlTemplate = fs.readFileSync(`${__dirname}/template.hbs`, {encoding: 'utf8'});

  fs.writeFileSync(`${outputDir}/apidoc.html`, handlebars.compile(apidocHtmlTemplate)(params));

  const handlebarsJs = fs.readFileSync(`${__dirname}/../../../node_modules/handlebars/dist/handlebars.min.js`, {encoding: 'utf8'});

  fs.writeFileSync(`${outputDir}/handlebars.min.js`, handlebarsJs);
};
