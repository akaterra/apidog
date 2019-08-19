const fs = require('fs');
const path = require('path');
const parserBlockLines = require('./parser.block_lines');
const utils = require('./utils');

function parseDir(dir, blocks, ignoreList, config) {
  if (!config) {
    config = {logger: utils.logger};
  }

  dir = path.resolve(dir);

  if (ignoreList) {
    ignoreList = ignoreList
      .filter((ignoreDir) => ignoreDir.trim())
      .map((ignoreDir) => new RegExp(`^${dir}/${ignoreDir
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^\\/]*')
      }`));
  }

  return parseDirInternal(dir, blocks, ignoreList, undefined, config);
}

function parseDirInternal(dir, blocks, ignoreList, definitions, config) {
  if (!blocks) {
    blocks = [];
  }

  if (!definitions) {
    definitions = {};
  }

  const dirList = fs.readdirSync(dir);

  dirList.forEach(function (dirEntry) {
    const fsStat = fs.statSync(dir + '/' + dirEntry);

    if (fsStat.isDirectory()) {
      if (ignoreList) {
        for (const ignoreDir of ignoreList) {
          if (ignoreDir.test(dir + '/' + dirEntry)) {
            return blocks;
          }
        }
      }

      blocks = parseDirInternal(dir + '/' + dirEntry, blocks, ignoreList, definitions, config);
    } else if (fsStat.isFile()) {
      if (dirEntry.slice(-7) === '.min.js') {
        return blocks;
      }

      const extensionIndex = dirEntry.lastIndexOf('.');

      if (extensionIndex !== - 1) {
        const source = fs.readFileSync(`${dir}/${dirEntry}`, { encoding: 'utf8' });

        config.logger.setFile(`${dir}/${dirEntry}`);

        switch (dirEntry.substr(extensionIndex + 1)) {
          case 'cs':
          case 'dart':
          case 'go':
          case 'java':
          case 'js':
          case 'php':
          case 'ts':
            blocks = blocks.concat(parseJavaDocStyle(source, definitions, config));

            break;

          case 'lua':
            blocks = blocks.concat(parseLua(source, definitions, config));

            break;

          case 'py':
            blocks = blocks.concat(parsePy(source, definitions, config));

            break;

          case 'rb':
            blocks = blocks.concat(parseRuby(source, definitions, config));

            break;
        }
      }
    }
  });

  return blocks;
}

const defaultCommentPrefixContent = [null, null];

function parseJavaDocStyle(source, definitions, config) {
  const blocks = source.match(/^\s*\/\*\*?[^!][.\s\t\S\n\r]*?\*\//gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return (line.match(/\s*\*(.*)/) || defaultCommentPrefixContent)[1];
      }).filter((line) => line), definitions, config);
    });
  }

  return [];
}

function parseLua(source, definitions, config) {
  const blocks = source.match(/^\s*--\[\[[.\s\t\S\n\r]*?--\]\]/gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.replace(/~+$/, '');
      }), definitions, config);
    });
  }

  return [];
}

function parsePerl(source, definitions, config) {
  const blocks = source.match(/^\s*#\*\*?[^!][.\s\t\S\n\r]*?#\*/gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return (line.match(/#\s?(.*)/) || defaultCommentPrefixContent)[1];
      }).filter((line) => line), definitions, config);
    });
  }

  return [];
}

function parsePy(source, definitions, config) {
  const blocks = source.match(/^(\s*'{3}|\s*"{3})[^!][.\s\t\S\n\r]*?(\s*'{3}|\s*"{3})/gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.substr(lines[0].indexOf(lines[0].match(/\S/)[0]));
      }), definitions, config);
    });
  }

  return [];
}

function parseRuby(source, definitions, config) {
  const blocks = source.match(/^\s*=begin[.\s\t\S\n\r]*?=end/gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.replace(/~+$/, '');
      }), definitions, config);
    });
  }

  return [];
}

module.exports = {
  normalizeDir(dir) {
    return dir;
  },
  parseDir,
  parseJavaDocStyle,
  parseLua,
  parsePerl,
  parsePy,
  parseRuby,
};
