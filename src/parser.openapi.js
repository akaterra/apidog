const parserOpenAPIUtils = require('./parser.openapi.utils.js');
const utils = require('./utils');

function parseOpenAPI(source, definitions, config) {
  if (!config) {
    config = {logger: utils.logger};
  }

  return parserOpenAPIUtils.convert(parserOpenAPIUtils.fetchSource(source), definitions, config).blocks;
}

module.exports = {
  normalizeDir(dir) {
    return dir.substr(0, dir.lastIndexOf('/'));
  },
  parseOpenAPI,
};
