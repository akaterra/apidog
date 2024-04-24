const fs = require('fs');
const parser = require('../src/parser.block_lines');
const utils = require('../src/utils');

describe('parser.block_lines parseBlockLines @apiSchema annotation', () => {
  it('should parse OpenAPI v1.2 api operation by nickname', () => {
    const lines = [
      '@apiSchema (group) {openapi=./spec/sample/openapi.json#apis[0]} getResourceById',
    ];

    parser.parseBlockLines(lines);

    expect(lines).toEqual([
      '',
      '@api {get} /resource/:resourceId/deprecated Find resource by id',
      '@apiVersion 1.0.0',
      '@apiDeprecated',
      '@apiDescription Find resource by id description',
      '@apiParam {String} resourceId id of resource',
    ]);
  });

  it('should parse OpenAPI v1.2 model', () => {
    const lines = [
      '@apiSchema (group) {openapi=./spec/sample/openapi.json#models.Resource} @apiParam',
    ];

    parser.parseBlockLines(lines);

    expect(lines).toEqual([
      '',
      '@apiParam {Number} [id] ',
      '@apiParam {Number} [field1] ',
      '@apiParam {Number} [field2] ',
      '@apiParam {String} [field3] Resource status',
      '@apiParam {Date} [field4] ',
    ]);
  });
});
