const fs = require('fs');
const parseBlockLines = require('./parser.block_lines');

function parseSwaggerFile(file) {
  if (file.slice(-5).toLowerCase() === '.json') {
    return parseSwagger(JSON.parse(fs.readFileSync(file, 'utf8')));
  }

  throw new Error(`Unknown Swagger file format "${file}"`);
}

function parseSwagger(obj) {
  const docBlocks = [];

  if (!obj || typeof obj !== 'object') {
    throwError();
  }

  if (!obj.apis || !Array.isArray(obj.apis)) {
    throwError();
  }

  for (const api of obj.apis) {
    if (!api || typeof api !== 'object') {
      throwError();
    }

    if (typeof api.path !== 'string' || !Array.isArray(api.operations)) {
      throwError();
    }
  }

  throw new Error('Malformed Swagger specification');
}

function throwError() {
  throw new Error('Malformed Swagger specification');
}

module.exports = {
  normalizeDir(dir) {
    return dir.substr(0, dir.lastIndexOf('/'));
  },
  parseSwaggerFile,
};
