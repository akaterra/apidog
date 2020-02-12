const fs = require('fs');
const path = require('path');
const parserBlockLines = require('./parser.block_lines');
const utils = require('./utils');

function parseDir(dir, blocks, filter, definitions, config) {
  if (!config) {
    config = {logger: utils.logger};
  }

  config.logger.info(`Files to be ignored: ${filter.ignore.join(', ')}`);

  if (!definitions) {
    definitions = {};
  }

  dir = path.resolve(dir);

  // first pass - definitions only
  parseDirInternal(dir, blocks, filter, definitions, config, true);

  // second pass - resolve definitions
  return parseDirInternal(dir, blocks, filter, definitions, config);
}

function parseDirInternal(dir, blocks, filter, definitions, config, onlyDefinitions) {
  if (!blocks) {
    blocks = [];
  }

  if (!definitions) {
    definitions = {};
  }

  const dirList = fs.readdirSync(dir);

  dirList.forEach((dirEntry) => {
    if (filter) {
      if (filter.filter && filter.filter.length) {
        if (!filter.filter.some((filter) => filter.test(dir + '/' + dirEntry))) {
          return blocks;
        }
      }

      if (filter.ignore && filter.ignore.length) {
        if (filter.ignore.some((ignore) => ignore.test(dir + '/' + dirEntry))) {
          return blocks;
        }
      }
    }

    const fsStat = fs.statSync(dir + '/' + dirEntry);

    if (fsStat.isDirectory()) {
      blocks = parseDirInternal(dir + '/' + dirEntry, blocks, filter, definitions, config, onlyDefinitions);
    } else if (fsStat.isFile()) {
      if (dirEntry.slice(-7) === '.min.js') {
        return blocks;
      }

      const extensionIndex = dirEntry.lastIndexOf('.');

      if (extensionIndex !== - 1 || dirEntry.toLowerCase() === 'apidoc') {
        const source = fs.readFileSync(`${dir}/${dirEntry}`, { encoding: 'utf8' });

        config.logger.setFile(`${dir}/${dirEntry}`);

        switch (dirEntry.substr(extensionIndex + 1)) {
          case 'apidoc':
            blocks = blocks.concat(parseApidoc(source, definitions, config, onlyDefinitions));

            break;

          case 'cs':
          case 'dart':
          case 'go':
          case 'java':
          case 'js':
          case 'php':
          case 'ts':
            blocks = blocks.concat(parseJavaDocStyle(source, definitions, config, onlyDefinitions));

            break;

          case 'lua':
            blocks = blocks.concat(parseLua(source, definitions, config, onlyDefinitions));

            break;

          case 'py':
            blocks = blocks.concat(parsePy(source, definitions, config, onlyDefinitions));

            break;

          case 'rb':
            blocks = blocks.concat(parseRuby(source, definitions, config, onlyDefinitions));

            break;
        }
      }
    }
  });

  return blocks;
}

const defaultCommentPrefixContent = [null, null];

function parseApidoc(source, definitions, config, onlyDefinitions) {
  const blocks = source.split(/\n{2,}/gm);

  if (blocks) {
    return blocks.map((block) => {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.map((line) => {
        return line.substr(lines[0].indexOf(lines[0].match(/\S/)[0]));
      }), definitions, config, onlyDefinitions);
    });
  }

  return [];
}

function parseJavaDocStyle(source, definitions, config, onlyDefinitions) {
  const blocks = source.match(/^\s*\/\*\*?[^!][.\s\t\S\n\r]*?\*\//gm);

  if (blocks) {
    return blocks.map((block) => {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return (line.match(/\s*\*(\s)?(.*)/) || defaultCommentPrefixContent)[2];
      }).filter((line) => line), definitions, config, onlyDefinitions);
    });
  }

  return [];
}

function parseLua(source, definitions, config, onlyDefinitions) {
  const blocks = source.match(/^\s*--\[\[[.\s\t\S\n\r]*?--\]\]/gm);

  if (blocks) {
    return blocks.map((block) => {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.replace(/~+$/, '');
      }), definitions, config, onlyDefinitions);
    });
  }

  return [];
}

function parsePerl(source, definitions, config, onlyDefinitions) {
  const blocks = source.match(/^\s*#\*\*?[^!][.\s\t\S\n\r]*?#\*/gm);

  if (blocks) {
    return blocks.map((block) => {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return (line.match(/#\s?(.*)/) || defaultCommentPrefixContent)[1];
      }).filter((line) => line), definitions, config, onlyDefinitions);
    });
  }

  return [];
}

function parsePy(source, definitions, config, onlyDefinitions) {
  const blocks = source.match(/^(\s*'{3}|\s*"{3})[^!][.\s\t\S\n\r]*?(\s*'{3}|\s*"{3})/gm);

  if (blocks) {
    return blocks.map((block) => {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.substr(lines[0].indexOf(lines[0].match(/\S/)[0]));
      }), definitions, config, onlyDefinitions);
    });
  }

  return [];
}

function parseRuby(source, definitions, config, onlyDefinitions) {
  const blocks = source.match(/^\s*=begin[.\s\t\S\n\r]*?=end/gm);

  if (blocks) {
    return blocks.map((block) => {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.replace(/~+$/, '');
      }), definitions, config, onlyDefinitions);
    });
  }

  return [];
}

module.exports = {
  normalizeDir(dir) {
    return dir;
  },
  parseApidoc,
  parseDir,
  parseJavaDocStyle,
  parseLua,
  parsePerl,
  parsePy,
  parseRuby,
};
