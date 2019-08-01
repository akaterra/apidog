const fs = require('fs');
const handlebars = require('handlebars');
const uglify = require('uglify-es');

module.exports = (outputDir) => (hbs, config, params) => {
  const styleCssTemplate = fs.readFileSync(`${__dirname}/assets/style.css`, {encoding: 'utf8'});
  fs.writeFileSync(`${outputDir}/style.css`, handlebars.compile(styleCssTemplate)(params));

  const apidocJsTemplate = fs.readFileSync(`${__dirname}/assets/apidoc.js`, {encoding: 'utf8'});

  if (process.env.NODE_ENV === 'test') {
    fs.writeFileSync(`${outputDir}/apidoc.min.js`, handlebars.compile(apidocJsTemplate)(params));
  } else {
    fs.writeFileSync(`${outputDir}/apidoc.min.js`, uglify.minify(handlebars.compile(apidocJsTemplate)(params)).code);
  }

  const template = fs.readFileSync(`${__dirname}/assets/content.hbs`, {encoding: 'utf8'});

  if (process.env.NODE_ENV === 'test') {
    fs.writeFileSync(`${outputDir}/apidoc.template.min.js`, `templateContent = \`${template}\``);
  } else {
    fs.writeFileSync(`${outputDir}/apidoc.template.min.js`, uglify.minify(`templateContent = \`${template}\``).code);
  }

  const apidocHtmlTemplate = fs.readFileSync(`${__dirname}/template.hbs`, {encoding: 'utf8'});
  fs.writeFileSync(`${outputDir}/apidoc.html`, handlebars.compile(apidocHtmlTemplate)(params));

  const handlebarsJs = fs.readFileSync(`${__dirname}/../../../node_modules/handlebars/dist/handlebars.min.js`, {encoding: 'utf8'});
  fs.writeFileSync(`${outputDir}/handlebars.min.js`, handlebarsJs);

  const favicon = fs.readFileSync(`${__dirname}/assets/favicon.ico`);
  fs.writeFileSync(`${outputDir}/favicon.ico`, favicon);
};
