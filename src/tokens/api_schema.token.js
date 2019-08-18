/**
 * @apiSchema [(group)] {jsonschema=./jsonschema.json[#internal.path]} @apiParam
 * @apiSchema [(group)] {swagger=./swagger.json#internal.path.to.api} operationNickname
 * @apiSchema [(group)] {swagger=./swagger.json#internal.path.to.model}  @apiParam
 */

const get = require('lodash.get');
const fs = require('fs');
const parserJsonschemaUtils = require('../parser.jsonschema.utils');
const parserSwaggerUtils = require('../parser.swagger.utils');
const utils = require('../utils');

const regex = /^(\((.+)\)\s+|){(.+)}(\s+(.+)?)/;

function parse(block, text, line, index, lines) {
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

  switch (schema[0].toLowerCase()) {
    case 'jsonschema':
      if (params.length === 0) {
        throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" missing token definition`);
      }

      let jsonSchemaSpec = parserJsonschemaUtils.fetchSource(schemaFile);
      let jsonSchema = jsonSchemaSpec;

      if (schemaPath) {
        jsonSchema = get(jsonSchema, schemaPath, parse);

        if (jsonSchema === parse) {
          throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" path not exists`);
        }
      }

      lines.splice(index, 1, ...[''].concat(parserJsonschemaUtils.convert(
        jsonSchema,
        tokens[2],
        params[0],
        jsonSchemaSpec
      )));

      return block;

    case 'swagger':
      if (!schemaPath) {
        throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" missing path to api definition or model`);
      }

      let swaggerSpec = parserSwaggerUtils.fetchSource(schemaFile);
      parserSwaggerUtils.validate(swaggerSpec);

      if (schemaPath.substr(0, 3) === 'apis') {
        let swaggerApi = get(swaggerSpec, schemaPath, parse);

        if (jsonSchema === parse) {
          throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" api definition not exists`);
        }

        swaggerApi = parserSwaggerUtils.validateApi(swaggerApi).operations.find((op) => op.nickname === params[0]);

        if (!swaggerApi) {
          throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" api definition nickname "${params[0]}" not exists`);
        }

        lines.splice(index, 1, ...[''].concat(parserSwaggerUtils.resolveApi(
          swaggerSpec,
          swaggerApi
        )));

        return block;
      }

      if (schemaPath.substr(0, 5) === 'models') {
        let swaggerModel = get(swaggerSpec, schemaPath, parse);

        if (jsonSchema === parse) {
          throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" model definition not exists`);
        }


      }

      break;

    default:
      throw new Error(`Unknown schema type "${schema[0]}"`)
  }
}

module.exports = {
  parse: parse,
};
