const utils = require('./utils');

const annotationParsers = {
  '@api': require('./annotations/api'),
  '@apiChapter': require('./annotations/api_chapter'),
  '@apiContentType': require('./annotations/api_content_type'),
  '@apiDefine': require('./annotations/api_define'),
  '@apiDeprecated': require('./annotations/api_deprecated'),
  '@apiDescription': require('./annotations/api_description'),
  '@apiGroup': require('./annotations/api_group'),
  '@apiError': require('./annotations/api_param').construct('error', true),
  '@apiErrorExample': require('./annotations/api_param_example').construct('error', '@errorExample'),
  '@apiErrorPrefix': require('./annotations/api_param_prefix').construct('errorPrefix'),
  '@apiErrorValue': require('./annotations/api_param_value').construct('errorValue'),
  '@apiExample': require('./annotations/api_param_example').construct(undefined, '@example'),
  '@apiFamily': require('./annotations/api_family'),
  '@apiHeader': require('./annotations/api_param').construct('header'),
  '@apiHeaderExample': require('./annotations/api_param_example').construct('header', '@headerExample'),
  '@apiHeaderValue': require('./annotations/api_param_value').construct('headerValue'),
  '@apiIgnore': require('./annotations/api_ignore'),
  '@apiName': require('./annotations/api_name'),
  '@apiNote': require('./annotations/api_note'),
  '@apiParam': require('./annotations/api_param'),
  '@apiParamExample': require('./annotations/api_param_example'),
  '@apiParamPrefix': require('./annotations/api_param_prefix'),
  '@apiParamValue': require('./annotations/api_param_value'),
  '@apiPermission': require('./annotations/api_permission'),
  '@apiPrivate': require('./annotations/api_private'),
  '@apiSampleRequest': require('./annotations/api_sample_request'),
  '@apiSampleRequestHook': require('./annotations/api_sample_request_hook'),
  '@apiSampleRequestOption': require('./annotations/api_sample_request_option'),
  '@apiSampleRequestProxy': require('./annotations/api_sample_request_proxy'),
  '@apiSampleRequestVariable': require('./annotations/api_sample_request_variable'),
  '@apiSr': require('./annotations/api_sample_request'),
  '@apiSrHook': require('./annotations/api_sample_request_hook'),
  '@apiSrOption': require('./annotations/api_sample_request_option'),
  '@apiSrProxy': require('./annotations/api_sample_request_proxy'),
  '@apiSrVariable': require('./annotations/api_sample_request_variable'),
  '@apiSchema': require('./annotations/api_schema'),
  '@apiSubgroup': require('./annotations/api_sub_group'),
  '@apiSuccess': require('./annotations/api_param').construct('success', true),
  '@apiSuccessExample': require('./annotations/api_param_example').construct('success', '@successExample'),
  '@apiSuccessPrefix': require('./annotations/api_param_prefix').construct('successPrefix'),
  '@apiSuccessValue': require('./annotations/api_param_value').construct('successValue'),
  '@apiTag': require('./annotations/api_tag'),
  '@apiUse': require('./annotations/api_use'),
  '@apiVersion': require('./annotations/api_version'),
};

function parseBlockLines(lines, definitions, config, onlyDefinitions) {
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

    if (line) {
      if (config) {
        config.logger.setLine(line);
      }

      /**
       * Example:
       * 
       * @apiToken abc def
       * 
       * annotation = "@apiToken"
       * text = "abc def"
       */
      const [annotation, text] = utils.strSplitBySpace(line.trim(), 1);

      if (annotation) {
        if (annotationParsers.hasOwnProperty(annotation)) {
          lastTokenParser = annotationParsers[annotation];

          // merge parsed properties with block properties
          try {
            Object.assign(
              block,
              lastTokenParser.parse(
                block,
                text,
                line,
                index,
                lines,
                definitions,
                config,
                onlyDefinitions
              )
            );
          } catch (e) {
            config.logger.throw(e);
          }
        } else {
          // unknown annotation
          if (config.logger && annotation.substr(0, 4) === '@api') {
            config.logger.warn(`Possibly unknown annotation: ${annotation}`);
          }

          // add line of description (or another props) via last used annotation parser
          if (lastTokenParser && lastTokenParser.addDescription) {
            Object.assign(block, lastTokenParser.addDescription(block, line, config));
          }
        }
      }
    }
  };

  return onlyDefinitions ? {} : block;
}

function toApidocBlockLines(block) {
  let lines = [];

  for (const annotationParser of Object.values(annotationParsers)) {
    if (annotationParser.toApidocString) {
      const annotationString = annotationParser.toApidocString(block);

      if (annotationString) {
        lines = lines.concat(Array.isArray(annotationString) ? annotationString : [annotationString]);
      }
    }
  }

  return lines;
}

module.exports = {
  parseBlockLines,
  toApidocBlockLines,
};
