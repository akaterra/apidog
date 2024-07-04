/**
 * @apiSchema [(group)] {jsonschema=./jsonschema.json[#internal.path]} @apiParam
 * @apiSchema [(group)] {openapi=./openapi.json#internal.path.to.api} operationNickname
 * @apiSchema [(group)] {openapi=./openapi.json#internal.path.to.model} @apiParam
 */

const get = require('lodash.get');
const fs = require('fs');
const parserJsonUtils = require('../parser.json.utils');
const parserJsonschemaUtils = require('../parser.jsonschema.utils');
const parserOpenAPIUtils = require('../parser.openapi.utils');
const utils = require('../utils');

const regex = /^(\((.+)\)\s+|){(.+)}(\s+(.+))?/;

function parse(block, text, line, index, lines, definitions, config) {
  if (!text) {
    throw new Error('@apiSchema malformed');
  }

  const tokens = regex.exec(text);

  if (!tokens) {
    throw new Error('@apiSchema malformed');
  }

  const schema = tokens[3].split('=', 2);

  if (schema.length < 2) {
    throw new Error('@apiSchema malformed');
  }

  const [schemaFile, schemaPath] = schema[1].split('#', 2);
  const params = utils.strSplitBySpace(tokens[5] || '');

  let conv;

  switch (schema[0].toLowerCase()) {
    case 'json':
      if (params.length === 0) {
        throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" missing annotation definition`);
      }

      let jsonSpec = parserJsonschemaUtils.fetchSource(schemaFile);
      let json = jsonSpec;

      if (schemaPath) {
        json = get(json, schemaPath, parse);

        if (json === parse) {
          throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" path not exists`);
        }
      }

      conv = parserJsonUtils.convert(json, params[0], config);

      lines.splice(index, 1, ...[''].concat(conv));

      return block;

    case 'jsonschema':
      if (params.length === 0) {
        throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" missing annotation definition`);
      }

      let jsonSchemaSpec = parserJsonschemaUtils.fetchSource(schemaFile);
      let jsonSchema = jsonSchemaSpec;

      if (schemaPath) {
        jsonSchema = get(jsonSchema, schemaPath, parse);

        if (jsonSchema === parse) {
          throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" path not exists`);
        }
      }

      conv = parserJsonschemaUtils.convert(jsonSchema, tokens[2], params[0], jsonSchemaSpec, config);

      lines.splice(index, 1, ...[''].concat(conv));

      return block;

    case 'openapi':
      if (!schemaPath || (schemaPath.substr(0, 4) !== 'apis' && schemaPath.substr(0, 6) !== 'models')) {
        throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" missing path to api definition or model`);
      }

      let openapiSpec = parserOpenAPIUtils.validate(parserOpenAPIUtils.fetchSource(schemaFile));

      if (schemaPath.substr(0, 4) === 'apis') {
        let openapiApi = get(openapiSpec, schemaPath, parse);

        if (openapiApi === parse) {
          throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" api definition not exists`);
        }

        const openapiApiOperation = parserOpenAPIUtils.validateApi(openapiSpec, openapiApi).operations.find((op) => op.nickname === params[0]);

        if (!openapiApiOperation) {
          throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" api definition nickname "${params[0]}" not exists`);
        }

        lines.splice(index, 1, ...[''].concat(parserOpenAPIUtils.resolveApi(
          openapiSpec,
          openapiApi,
          [],
          [openapiApiOperation],
        )[0]));

        return block;
      }

      if (schemaPath.substr(0, 6) === 'models') {
        let openapiModel = get(openapiSpec, schemaPath, parse);

        if (openapiModel === parse) {
          throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" model definition not exists`);
        }

        lines.splice(index, 1, ...[''].concat(parserOpenAPIUtils.resolveModel(
          openapiSpec,
          params[0],
          openapiModel,
          ''
        )));

        return block;
      }

      break;

    default:
      throw new Error(`Unknown schema type "${schema[0]}"`)
  }
}

module.exports = {
  parse: parse,
};
