const { Block } = require('./block');
const utils = require('./utils');

const annotationParsers = {
  '@api': require('./annotations/api'),
  '@apiauthheader': require('./annotations/api_param').construct('authHeader'),
  '@apiauthparam': require('./annotations/api_param').construct('authParam'),
  '@apiauthquery': require('./annotations/api_param').construct('authQuery'),
  '@apichapter': require('./annotations/api_chapter'),
  '@apicontenttype': require('./annotations/api_content_type'),
  '@apidefine': require('./annotations/api_define'),
  '@apideprecated': require('./annotations/api_deprecated'),
  '@apidescription': require('./annotations/api_description'),
  '@apigroup': require('./annotations/api_group'),
  '@apierrorroot': require('./annotations/api_param_root').construct('error', true),
  '@apierror': require('./annotations/api_param').construct('error', true),
  '@apierrorexample': require('./annotations/api_param_example').construct('error'),
  '@apierrorprefix': require('./annotations/api_param_prefix').construct('errorPrefix'),
  '@apierrorvalue': require('./annotations/api_param_value').construct('errorValue'),
  '@apiexample': require('./annotations/api_param_example').construct(),
  '@apifamily': require('./annotations/api_family'),
  '@apiheader': require('./annotations/api_param').construct('header'),
  '@apiheaderexample': require('./annotations/api_param_example').construct('header'),
  '@apiheadervalue': require('./annotations/api_param_value').construct('headerValue'),
  '@apiignore': require('./annotations/api_ignore'),
  '@apiname': require('./annotations/api_name'),
  '@apinote': require('./annotations/api_note'),
  '@apiparamroot': require('./annotations/api_param_root'),
  '@apiparam': require('./annotations/api_param'),
  '@apiparamexample': require('./annotations/api_param_example'),
  '@apiparamprefix': require('./annotations/api_param_prefix'),
  '@apiparamvalue': require('./annotations/api_param_value'),
  '@apipermission': require('./annotations/api_permission'),
  '@apiprivate': require('./annotations/api_private'),
  '@apiquery': require('./annotations/api_param').construct('query', true),
  '@apisamplerequest': require('./annotations/api_sample_request'),
  '@apisamplerequesthook': require('./annotations/api_sample_request_hook'),
  '@apisamplerequestoption': require('./annotations/api_sample_request_option'),
  '@apisamplerequestproxy': require('./annotations/api_sample_request_proxy'),
  '@apisamplerequestvariable': require('./annotations/api_sample_request_variable'),
  '@apisr': require('./annotations/api_sample_request'),
  '@apisrhook': require('./annotations/api_sample_request_hook'),
  '@apisroption': require('./annotations/api_sample_request_option'),
  '@apisrproxy': require('./annotations/api_sample_request_proxy'),
  '@apisrvariable': require('./annotations/api_sample_request_variable'),
  '@apischema': require('./annotations/api_schema'),
  '@apisubgroup': require('./annotations/api_sub_group'),
  '@apisuccessroot': require('./annotations/api_param_root').construct('success', true),
  '@apisuccess': require('./annotations/api_param').construct('success', true),
  '@apisuccessexample': require('./annotations/api_param_example').construct('success'),
  '@apisuccessprefix': require('./annotations/api_param_prefix').construct('successPrefix'),
  '@apisuccessvalue': require('./annotations/api_param_value').construct('successValue'),
  '@apitag': require('./annotations/api_tag'),
  '@apiuse': require('./annotations/api_use'),
  '@apiversion': require('./annotations/api_version'),
};

function parseBlockLines(lines, definitions, config, onlyDefinitions) {
  if (!config) {
    config = {logger: utils.logger};
  }

  if (!definitions) {
    definitions = {};
  }

  const block = new Block();

  let lastTokenParser;

  // think good before to change it to "lines.forEach" - amount of lines can be changed by @apiUse
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

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
    const annotationLowerCase = annotation ? annotation.toLowerCase() : null;

    if (annotationLowerCase && annotationParsers.hasOwnProperty(annotationLowerCase)) {
      lastTokenParser = annotationParsers[annotationLowerCase];

      // merge parsed properties with block properties
      try {
        const blockParams = lastTokenParser.parse(
          block,
          text,
          line,
          index,
          lines,
          definitions,
          config,
          onlyDefinitions
        );

        if (blockParams.private && config) {
          if (config.private === false) {
            return null;
          } else if (Array.isArray(config.private) && config.private.some((key) => !blockParams.private.includes(key))) {
            return null;
          }
        }

        Object.assign(
          block,
          blockParams,
        );
      } catch (e) {
        config.logger.throw(e);
      }
    } else {
      // unknown annotation
      if (config.logger && annotationLowerCase && annotationLowerCase.slice(0, 4) === '@api') {
        config.logger.warn(`Possibly unknown annotation: ${annotation}`);
      }

      // add line of description (or another props) by using last selected annotation parser
      if (lastTokenParser && lastTokenParser.addDescription) {
        Object.assign(block, lastTokenParser.addDescription(block, line, config));
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
  Block,
  parseBlockLines,
  toApidocBlockLines,
};
