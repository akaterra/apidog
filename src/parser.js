const fs = require('fs');
const path = require('path');
const utils = require('./utils');

const tokenParsers = {
  '@api': require('./tokens/api.token'),
  '@apiChapter': require('./tokens/api_chapter.token'),
  '@apiContentType': require('./tokens/api_content_type.token'),
  '@apiDefine': require('./tokens/api_define.token'),
  '@apiDeprecated': require('./tokens/api_deprecated.token'),
  '@apiDescription': require('./tokens/api_description.token'),
  '@apiGroup': require('./tokens/api_group.token'),
  '@apiError': require('./tokens/api_param.token').construct('error'),
  '@apiErrorExample': require('./tokens/api_param_example.token').construct('error', '@errorExample'),
  '@apiExample': require('./tokens/api_param_example.token').construct(void 0, '@example'),
  '@apiHeader': require('./tokens/api_param.token').construct('header'),
  '@apiHeaderExample': require('./tokens/api_param_example.token').construct('header', '@headerExample'),
  '@apiIgnore': require('./tokens/api_ignore.token'),
  '@apiName': require('./tokens/api_name.token'),
  '@apiOption': require('./tokens/api_option.token'),
  '@apiParam': require('./tokens/api_param.token'),
  '@apiParamExample': require('./tokens/api_param_example.token'),
  '@apiParamPrefix': require('./tokens/api_param_prefix.token'),
  '@apiPermission': require('./tokens/api_permission.token'),
  '@apiPrivate': require('./tokens/api_private.token'),
  '@apiSampleRequest': require('./tokens/api_sample_request.token'),
  '@apiSampleRequestHook': require('./tokens/api_sample_request_hook.token'),
  '@apiSampleRequestProxy': require('./tokens/api_sample_request_proxy.token'),
  '@apiSchema': require('./tokens/api_schema.token'),
  '@apiSubgroup': require('./tokens/api_sub_group.token'),
  '@apiSuccess': require('./tokens/api_param.token').construct('success'),
  '@apiSuccessExample': require('./tokens/api_param_example.token').construct('success', '@successExample'),
  '@apiUse': require('./tokens/api_use.token'),
  '@apiVersion': require('./tokens/api_version.token'),
};

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

function parseBlockLines(lines, definitions, logger) {
  if (!definitions) {
    definitions = {};
  }

  const block = {};

  let lastCmdParser;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    logger.setLine(line);

    const tokens = utils.strSplitBySpace(line.trim(), 1);

    if (tokenParsers.hasOwnProperty(tokens[0])) {
      lastCmdParser = tokenParsers[tokens[0]];

      Object.assign(block, lastCmdParser.parse(block, tokens[1], line, index, lines, definitions));
    } else {
      if (tokens[0].substr(0, 4) === '@api') {
        logger.warn(`Possibly unknown token: ${tokens[0]}`);
      }

      if (lastCmdParser && lastCmdParser.addDescription) {
        Object.assign(block, lastCmdParser.addDescription(block, line));
      }
    }
  }

  return block;
}

const defaultCommentPrefixContent = [null, null];

function parseJavaDocStyle(source, definitions, logger) {
  const blocks = source.match(/^\s*\/\*\*?[^!][.\s\t\S\n\r]*?\*\//gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
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

      return parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
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

      return parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
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

      return parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
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

      return parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.replace(/~+$/, '');
      }), definitions, logger);
    });
  }

  return [];
}

module.exports = {
  parseBlockLines,
  parseDir,
  parseJavaDocStyle,
  parseLua,
  parsePerl,
  parsePy,
  parseRuby,
};
