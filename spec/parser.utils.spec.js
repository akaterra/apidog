const parserUtils = require('../src/parser.utils');

describe('parser.utils paramsToJsonSchema', () => {
  it('should convert', () => {
    const params = [{
      field: {
        name: 'a',
      },
      type: {
        name: 'String',
      },
    }, {
      field: {
        name: 'b', isOptional: true,
      },
      type: {
        name: 'Number', allowedValues: [1, 2, 3],
      },
    }, {
      field: {
        name: 'c[]',
      },
      type: {
        name: 'String'
      },
    }, {
      field: {
        name: 'd[].a',
      },
      type: {
        name: 'String'
      },
    }, {
      field: {
        name: 'e',
      },
      type: {
        name: 'Object',
      },
    }, {
      field: {
        name: 'f.a',
      },
      type: {
        name: 'String',
      },
    }];

    expect(parserUtils.paramsToJsonSchema(params)).toEqual({
      type: 'object',
      required: ['a', 'c', 'd', 'e', 'f'],
      properties: {
        a: {
          type: 'string',
        },
        b: {
          type: 'number',
          enum: [1, 2, 3],
        },
        c: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        d: {
          type: 'array',
          items: {
            type: 'object',
            required: ['a'],
            properties: {
              a: {
                type: 'string',
              },
            },
          },
        },
        e: {
          type: 'object',
        },
        f: {
          type: 'object',
          required: ['a'],
          properties: {
            a: {
              type: 'string',
            },
          },
        },
      },
    });
  });
});
