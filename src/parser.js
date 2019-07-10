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

function parseDir(dir, blocks, ignoreList) {
  dir = path.resolve(dir);

  if (ignoreList) {
    ignoreList = ignoreList
      .filter((ignoreDir) => ignoreDir.trim())
      .map((ignoreDir) => new RegExp(`^${dir}/${ignoreDir
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^\\/]*')
      }`));
  }

  return parseDirInternal(dir, blocks, ignoreList);
}

function parseDirInternal(dir, blocks, ignoreList, definitions) {
  if (! blocks) {
    blocks = [];
  }

  if (! definitions) {
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

      blocks = parseDirInternal(dir + '/' + dirEntry, blocks, ignoreList, definitions);
    } else if (fsStat.isFile()) {
      const extensionIndex = dirEntry.lastIndexOf('.');

      if (extensionIndex !== - 1) {
        const source = fs.readFileSync(dir + '/' + dirEntry, { encoding: 'utf8' });

        switch (dirEntry.substr(extensionIndex + 1)) {
          case 'cs':
          case 'dart':
          case 'go':
          case 'java':
          case 'js':
          case 'php':
          case 'ts':
            blocks = blocks.concat(parseJavaDocStyle(source, definitions));

            break;

          case 'lua':
            blocks = blocks.concat(parseLua(source, definitions));

            break;

          case 'py':
            blocks = blocks.concat(parsePy(source, definitions));

            break;

          case 'rb':
            blocks = blocks.concat(parseRuby(source, definitions));

            break;
        }
      } else {

      }
    }
  });

  return blocks;
}

function parseBlockLines(lines, definitions) {
  if (! definitions) {
    definitions = {};
  }

  const block = {};

  let lastCmdParser;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const tokens = utils.strSplitBySpace(line.trim(), 1);

    if (tokenParsers.hasOwnProperty(tokens[0])) {
      lastCmdParser = tokenParsers[tokens[0]];

      Object.assign(block, lastCmdParser.parse(block, tokens[1], line, index, lines, definitions));
    } else {
      if (lastCmdParser) {
        Object.assign(block, lastCmdParser.addDescription(block, line));
      }
    }
  }

  return block;
}

function parseJavaDocStyle(source, definitions) {
  const blocks = source.match(/^\s*\/\*\*?[^!][.\s\t\S\n\r]*?\*\//gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.match(/\s*\*\s?(.*)/)[1];
      }), definitions);
    });
  }

  return [];
}

function parseLua(source, definitions) {
  const blocks = source.match(/^\s*--\[\[[.\s\t\S\n\r]*?--\]\]/gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line;
      }), definitions);
    });
  }

  return [];
}

function parsePerl(source, definitions) {
  const blocks = source.match(/^\s*#\*\*?[^!][.\s\t\S\n\r]*?#\*/gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.match(/#\s?(.*)/)[1];
      }), definitions);
    });
  }

  return [];
}

function parsePy(source, definitions) {
  const blocks = source.match(/^(\s*'{3}|\s*"{3})[^!][.\s\t\S\n\r]*?(\s*'{3}|\s*"{3})/gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line.substr(lines[0].indexOf(lines[0].match(/\S/)[0]));
      }), definitions);
    });
  }

  return [];
}

function parseRuby(source, definitions) {
  const blocks = source.match(/^\s*=begin[.\s\t\S\n\r]*?=end/gm);

  if (blocks) {
    return blocks.map(function (block) {
      const lines = block.trim().split('\n');

      return parseBlockLines(lines.slice(1, lines.length - 1).map((line) => {
        return line;
      }), definitions);
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
