const parseBlockLines = require('./parser.block_lines');
const parserOpenAPI12Utils = require('./parser.openapi.1.2.utils');
const utils = require('./utils');

function parseOpenAPIFile(source, config) {
  if (!config) {
    config = {logger: utils.logger};
  }

  return parserOpenAPI12Utils.convert(parserOpenAPI12Utils.fetchSource(source)).map((lines) => {
    return parseBlockLines.parseBlockLines(lines, undefined, config);
  });
}

module.exports = {
  normalizeDir(dir) {
    return dir.substr(0, dir.lastIndexOf('/'));
  },
  parseOpenAPIFile,
};
