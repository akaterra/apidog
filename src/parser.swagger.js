const parseBlockLines = require('./parser.block_lines');
const parserSwaggerUtils = require('./parser.swagger.1.2.utils');
const utils = require('./utils');

function parseSwaggerFile(source, config) {
  if (!config) {
    config = {logger: utils.logger};
  }

  return parserSwaggerUtils.convert(parserSwaggerUtils.fetchSource(source)).map((lines) => {
    return parseBlockLines.parseBlockLines(lines, undefined, config);
  });
}

module.exports = {
  normalizeDir(dir) {
    return dir.substr(0, dir.lastIndexOf('/'));
  },
  parseSwaggerFile,
};
