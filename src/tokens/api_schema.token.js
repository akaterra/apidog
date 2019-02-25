/**
 * @apiSchema [(group)] {jsonschema=./jsonschema.json} target
 */

const fs = require('fs');
const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

const regex = /^(\((.+)\)\s+|){(.+)}\s+(.+)/;

function parse(block, text, line, index, lines) {
  const tokens = regex.exec(text);

  if (! tokens) {
    throw new Error('@apiSchema malformed');
  }

  const jsonSchema = JSON.parse(fs.readFileSync(tokens[3]));

  lines.splice(index, 1, ...[''].concat(buildBlockLinesByJsonSchema(
    jsonSchema.properties,
    jsonSchema.required,
    tokens[2],
    '',
    [],
    tokens[4]
  )));

  return block;
}

const jsonSchemaTypeToApiDocType = {
  boolean: 'Boolean',
  number: 'Number',
  object: 'Object',
  string: 'String',
};

function buildBlockLinesByJsonSchema(props, propsRequired, group, field, lines, param) {
  const paramGroup = group ? `(${group}) ` : '';

  Object.entries(props).forEach(([key, val]) => {
    const paramDefault = val.default ? `=${quote(val.default)}` : '';
    const paramEnum = val.enum ? `=${val.enum.map(quote).join(',')}` : '';
    const paramKey = propsRequired && propsRequired.indexOf(key) !== - 1
      ? `${field}${key}${paramDefault}`
      : `[${field}${key}${paramDefault}]`;
    const paramTitle = val.title ? ` ${val.title}` : '';

    switch (val.type) {
      case 'boolean':
      case 'number':
      case 'string':
        lines.push(`${param} ${paramGroup}{${jsonSchemaTypeToApiDocType[val.type]}${paramEnum}} ${paramKey}${paramTitle}`);

        if (val.description) {
          lines.push(val.description);
        }

        break;

      case 'array':
        lines.push(`${param} ${paramGroup}{${jsonSchemaTypeToApiDocType[val.item.type]}[]${paramEnum}} ${paramKey}${paramTitle}`);

        if (val.description) {
          lines.push(val.description);
        }

        if (val.item.properties) {
          buildBlockLinesByJsonSchema(val.item.properties, val.item.required, group, `${field}${key}[].`, lines, param);
        }

        break;

      case 'object':
        lines.push(`${param} ${paramGroup}{${jsonSchemaTypeToApiDocType[val.type]}${paramEnum}} ${paramKey}${paramTitle}`);

        if (val.description) {
          lines.push(val.description);
        }

        if (val.properties) {
          buildBlockLinesByJsonSchema(val.properties, val.required, group, `${field}${key}.`, lines, param);
        }

        break;
    }
  });

  return lines;
}

function quote(val) {
  if (typeof val === 'string' && val.indexOf(' ') !== - 1) {
    return `"${val.replace(/"/g, '\\"')}"`;
  }

  return val;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
