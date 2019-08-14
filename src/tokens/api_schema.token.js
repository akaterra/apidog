/**
 * @apiSchema [(group)] {jsonschema=./jsonschema.json[#internal.path]} target
 */

const fs = require('fs');
const parserJsonschemaUtils = require('../parser.jsonschema.utils');
const parserSwaggerUtils = require('../parser.swagger.utils');

const regex = /^(\((.+)\)\s+|){(.+)}\s+(.+)/;

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

  switch (schema[0].toLowerCase()) {
    case 'jsonschema':
      let rootJsonSchema = JSON.parse(fs.readFileSync(schemaFile));
      let jsonSchema = rootJsonSchema;

      if (schemaPath) {
        for (const key of schemaPath.split('.')) {
          if (jsonSchema && typeof jsonSchema === 'object' && key in jsonSchema) {
            jsonSchema = jsonSchema[key];
          } else {
            throw new Error(`@apiSchema "${schemaFile}#${schemaPath}" path not exists`);
          }
        }
      }

      lines.splice(index, 1, ...[''].concat(parserJsonschemaUtils.convert(
        jsonSchema,
        tokens[2],
        tokens[4],
        rootJsonSchema
      )));

      return block;

    case 'swaggermodel':
    default:
      throw new Error(`Unknown schema type "${schema[0]}"`)
  }
}

module.exports = {
  parse: parse,
};
