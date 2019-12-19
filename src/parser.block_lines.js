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
  '@apiErrorValue': require('./tokens/api_param_value.token').construct('errorValue'),
  '@apiExample': require('./tokens/api_param_example.token').construct(void 0, '@example'),
  '@apiFamily': require('./tokens/api_family.token'),
  '@apiHeader': require('./tokens/api_param.token').construct('header'),
  '@apiHeaderExample': require('./tokens/api_param_example.token').construct('header', '@headerExample'),
  '@apiHeaderValue': require('./tokens/api_param_value.token').construct('headerValue'),
  '@apiIgnore': require('./tokens/api_ignore.token'),
  '@apiName': require('./tokens/api_name.token'),
  '@apiNote': require('./tokens/api_note.token'),
  '@apiParam': require('./tokens/api_param.token'),
  '@apiParamExample': require('./tokens/api_param_example.token'),
  '@apiParamPrefix': require('./tokens/api_param_prefix.token'),
  '@apiParamValue': require('./tokens/api_param_value.token'),
  '@apiPermission': require('./tokens/api_permission.token'),
  '@apiPrivate': require('./tokens/api_private.token'),
  '@apiSampleRequest': require('./tokens/api_sample_request.token'),
  '@apiSampleRequestHook': require('./tokens/api_sample_request_hook.token'),
  '@apiSampleRequestOption': require('./tokens/api_sample_request_option.token'),
  '@apiSampleRequestProxy': require('./tokens/api_sample_request_proxy.token'),
  '@apiSampleRequestVariable': require('./tokens/api_sample_request_variable.token'),
  '@apiSr': require('./tokens/api_sample_request.token'),
  '@apiSrHook': require('./tokens/api_sample_request_hook.token'),
  '@apiSrOption': require('./tokens/api_sample_request_option.token'),
  '@apiSrProxy': require('./tokens/api_sample_request_proxy.token'),
  '@apiSrVariable': require('./tokens/api_sample_request_variable.token'),
  '@apiSchema': require('./tokens/api_schema.token'),
  '@apiSubgroup': require('./tokens/api_sub_group.token'),
  '@apiSuccess': require('./tokens/api_param.token').construct('success'),
  '@apiSuccessExample': require('./tokens/api_param_example.token').construct('success', '@successExample'),
  '@apiUse': require('./tokens/api_use.token'),
  '@apiVersion': require('./tokens/api_version.token'),
};

function parseBlockLines(lines, definitions, config) {
  if (!config) {
    config = {logger: utils.logger};
  }

  if (!definitions) {
    definitions = {};
  }

  const block = {};

  let lastTokenParser;

  // think good before to change it to "lines.forEach" - amount of lines can be changed by @apiUse
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line) {
      return;
    }

    if (config) {
      config.logger.setLine(line);
    }

    /**
     * Example:
     * 
     * @apiToken abc def
     * 
     * token = "@apiToken"
     * text = "abc def"
     */
    const [token, text] = utils.strSplitBySpace(line.trim(), 1);

    if (token) {
      if (tokenParsers.hasOwnProperty(token)) {
        if (text) {
          lastTokenParser = tokenParsers[token];

          Object.assign(block, lastTokenParser.parse(block, text, line, index, lines, definitions, config));
        }
      } else {
        // unknown token
        if (config.logger && token.substr(0, 4) === '@api') {
          config.logger.warn(`Possibly unknown token: ${token}`);
        }

        // add line of description (or another props) via last used token parser
        if (lastTokenParser && lastTokenParser.addDescription) {
          Object.assign(block, lastTokenParser.addDescription(block, line, config));
        }
      }
    }
  };

  return block;
}

module.exports = {
  parseBlockLines,
};
