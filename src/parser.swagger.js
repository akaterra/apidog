const parseBlockLines = require('./parser.block_lines');
const parserSwaggerUtils = require('./parser.swagger.utils');
const utils = require('./utils');

function parseSwaggerFile(source, logger) {
  if (!logger) {
    logger = new utils.Logger();
  }

  return parserSwaggerUtils.convert(parserSwaggerUtils.fetchSource(source)).map((lines) => {
    return parseBlockLines.parseBlockLines(lines, undefined, logger);
  });
}

module.exports = {
  normalizeDir(dir) {
    return dir.substr(0, dir.lastIndexOf('/'));
  },
  parseSwaggerFile,
};
