const fs = require('fs');
const handlebars = require('handlebars');
const parseBlockLines = require('../../parser.block_lines');

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;
    const content = params.blocks
      .map((block) => block.toApidocStrings())
      .filter((strings) => strings.length)
      .map((strings) => strings.join('\n'))
      .join('\n\n\n');

    if (outputDir === 'stdout') {
      return content;
    } else {
      fs.writeFileSync(`${outputDir}/apidoc.apidoc`, content);
    }
  }
});
