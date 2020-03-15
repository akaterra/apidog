const fs = require('fs');
const handlebars = require('handlebars');
const parseBlockLines = require('../../parser.block_lines');

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;
    const apidocBlocks = params.blocks
      .map((block) => parseBlockLines.toApidocBlockLines(block))
      .filter((block) => block.length)
      .map((block) => block.join('\n'))
      .join('\n\n\n');

    fs.writeFileSync(`${outputDir}/apidoc.apidoc`, apidocBlocks);
  }
});
