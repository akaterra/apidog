const parserUtils = require('../src/parser.utils');

describe('parser.utils enumUriPlaceholders', () => {
  it('should enum', () => {
    const placeholders = {};

    parserUtils.enumUriPlaceholders('schema://uri/:a/:b?c=:c&d=:d', (placeholder, isInQuery) => {
      placeholders[placeholder] = isInQuery;
    });

    expect(placeholders).toEqual({
      a: false,
      b: false,
      c: true,
      d: true,
    });
  });
});

describe('parser.utils convertParamsToJsonSchema', () => {
  it('should convert', () => {
    const params = [{
      description: ['a', 'b'],
      field: {
        name: 'a',
      },
      type: {
        name: 'String', modifiers: {initial: 'string'},
      },
    }, {
      field: {
        name: 'b', isOptional: true,
      },
      type: {
        name: 'Number', allowedValues: [1, 2, 3], modifiers: {initial: 'number'},
      },
    }, {
      field: {
        name: 'c[]',
      },
      type: {
        name: 'String', modifiers: {initial: 'string'},
      },
    }, {
      field: {
        name: 'd[].a',
      },
      type: {
        name: 'String', modifiers: {initial: 'string'},
      },
    }, {
      field: {
        name: 'e',
      },
      type: {
        name: 'Object', modifiers: {initial: 'object'},
      },
    }, {
      field: {
        name: 'f.a',
      },
      type: {
        name: 'String', modifiers: {initial: 'string'},
      },
    }, {
      field: {
        name: 'g',
      },
      type: {
        name: 'String', modifiers: {initial: 'string', list: true},
      },
    }];

    expect(parserUtils.convertParamsToJsonSchema(params)).toEqual({
      type: 'object',
      required: ['a', 'c', 'd', 'e', 'f', 'g'],
      properties: {
        a: {
          type: 'string',
          description: 'a\nb',
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
        g: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    });
  });
});
