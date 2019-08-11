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
  '@apiFamily': require('./tokens/api_family.token'),
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
  '@apiSampleRequestVariable': require('./tokens/api_sample_request_variable.token'),
  '@apiSr': require('./tokens/api_sample_request.token'),
  '@apiSrHook': require('./tokens/api_sample_request_hook.token'),
  '@apiSrProxy': require('./tokens/api_sample_request_proxy.token'),
  '@apiSrVariable': require('./tokens/api_sample_request_variable.token'),
  '@apiSchema': require('./tokens/api_schema.token'),
  '@apiSubgroup': require('./tokens/api_sub_group.token'),
  '@apiSuccess': require('./tokens/api_param.token').construct('success'),
  '@apiSuccessExample': require('./tokens/api_param_example.token').construct('success', '@successExample'),
  '@apiUse': require('./tokens/api_use.token'),
  '@apiVersion': require('./tokens/api_version.token'),
};

function parseBlockLines(lines, definitions, logger) {
  if (!definitions) {
    definitions = {};
  }

  const block = {};

  let lastCmdParser;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (logger) {
      logger.setLine(line);
    }

    const tokens = utils.strSplitBySpace(line.trim(), 1);

    if (tokenParsers.hasOwnProperty(tokens[0])) {
      lastCmdParser = tokenParsers[tokens[0]];

      Object.assign(block, lastCmdParser.parse(block, tokens[1], line, index, lines, definitions));
    } else {
      if (logger && tokens[0].substr(0, 4) === '@api') {
        logger.warn(`Possibly unknown token: ${tokens[0]}`);
      }

      if (lastCmdParser && lastCmdParser.addDescription) {
        Object.assign(block, lastCmdParser.addDescription(block, line));
      }
    }
  }

  return block;
}

module.exports = {
  parseBlockLines,
};
