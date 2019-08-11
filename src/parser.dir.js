const fs = require('fs');
const path = require('path');
const parserBlockLines = require('./parser.block_lines');
const utils = require('./utils');

function parseDir(dir, blocks, ignoreList, logger) {
  dir = path.resolve(dir);

  if (ignoreList) {
    ignoreList = ignoreList
      .filter((ignoreDir) => ignoreDir.trim())
      .map((ignoreDir) => new RegExp(`^${dir}/${ignoreDir
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^\\/]*')
      }`));
  }

  if (!logger) {
    logger = new utils.Logger();
  }

  return parseDirInternal(dir, blocks, ignoreList, undefined, logger);
}

function parseDirInternal(dir, blocks, ignoreList, definitions, logger) {
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

      blocks = parseDirInternal(dir + '/' + dirEntry, blocks, ignoreList, definitions, logger);
    } else if (fsStat.isFile()) {
      if (dirEntry.slice(-7) === '.min.js') {
        return blocks;
      }

      const extensionIndex = dirEntry.lastIndexOf('.');

      if (extensionIndex !== - 1) {
        const source = fs.readFileSync(`${dir}/${dirEntry}`, { encoding: 'utf8' });

        logger.setFile(`${dir}/${dirEntry}`);

        switch (dirEntry.substr(extensionIndex + 1)) {
          case 'cs':
          case 'dart':
          case 'go':
          case 'java':
          case 'js':
          case 'php':
          case 'ts':
            blocks = blocks.concat(parseJavaDocStyle(source, definitions, logger));

            break;

          case 'lua':
            blocks = blocks.concat(parseLua(source, definitions, logger));

            break;

          case 'py':
            blocks = blocks.concat(parsePy(source, definitions, logger));

            break;

          case 'rb':
            blocks = blocks.concat(parseRuby(source, definitions, logger));

            break;
        }
      }
    }
  });

  return blocks;
}

const defaultCommentPrefixContent = [null, null];

function parseJavaDocStyle(source, definitions, logger) {
  const blocks = source.match(/^\s*\/\*\*?[^!][.\s\t\S\n\r]*?\*\//gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return (line.match(/\s*\*(.*)/) || defaultCommentPrefixContent)[1];
      }).filter((line) => line), definitions, logger);
    });
  }

  return [];
}

function parseLua(source, definitions, logger) {
  const blocks = source.match(/^\s*--\[\[[.\s\t\S\n\r]*?--\]\]/gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.replace(/~+$/, '');
      }), definitions, logger);
    });
  }

  return [];
}

function parsePerl(source, definitions, logger) {
  const blocks = source.match(/^\s*#\*\*?[^!][.\s\t\S\n\r]*?#\*/gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return (line.match(/#\s?(.*)/) || defaultCommentPrefixContent)[1];
      }).filter((line) => line), definitions, logger);
    });
  }

  return [];
}

function parsePy(source, definitions, logger) {
  const blocks = source.match(/^(\s*'{3}|\s*"{3})[^!][.\s\t\S\n\r]*?(\s*'{3}|\s*"{3})/gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.substr(lines[0].indexOf(lines[0].match(/\S/)[0]));
      }), definitions, logger);
    });
  }

  return [];
}

function parseRuby(source, definitions, logger) {
  const blocks = source.match(/^\s*=begin[.\s\t\S\n\r]*?=end/gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parserBlockLines.parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.replace(/~+$/, '');
      }), definitions, logger);
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
