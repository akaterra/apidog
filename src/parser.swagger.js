const fs = require('fs');
const parseBlockLines = require('./parser.block_lines');
const parserSwaggerUtils = require('./parser.swagger.utils');
const utils = require('./utils');

function parseSwaggerFile(file, logger) {
  if (!logger) {
    logger = new utils.Logger();
  }

  if (file.slice(-5).toLowerCase() === '.json') {
    return parserSwaggerUtils.convert(JSON.parse(fs.readFileSync(file, 'utf8'))).map((lines) => {
      return parseBlockLines.parseBlockLines(lines, undefined, logger);
    });
  }

  throw new Error(`Unknown Swagger file format "${file}"`);
}

module.exports = {
  normalizeDir(dir) {
    return dir.substr(0, dir.lastIndexOf('/'));
  },
  parseSwaggerFile,
};
