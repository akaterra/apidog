const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiParam annotation', () => {
  it('should parse multiple params', () => {
    const lines = [
      '@apiParam A_B.C',
      '@apiParam A_B.C This is a description',
      '@apiParam A_B.C This is a description', 'Some description',
      '@apiParam A_B.C=A This is a description',
      '@apiParam A_B.C="A B C" This is a description',
      '@apiParam [A_B.C] This is a description',
      '@apiParam [A_B.C=A] This is a description',
      '@apiParam [A_B.C="A B C"] This is a description',
      '@apiParam (groupA) A_B.C This is a description',
      '@apiParam {typeA} A_B.C This is a description',
      '@apiParam {typeA=A,B,C} A_B.C This is a description',
      '@apiParam {typeA="A,B,C","D,E,F","G,H,I"} A_B.C This is a description',
      '@apiParam (groupA) {typeA="A,B,C","D,E,F","G,H,I"} [A_B.C="A B C"] This is a description',
      '@apiParam (isNotTyped) A_B.C This is a description',
    ];

    expect(parser.parseBlockLines(lines)).toEqual({
      param: [{ // 0
        description: [],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 1
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 2
        description: ['This is a description', 'Some description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 3
        description: ['This is a description'],
        field: { defaultValue: 'A', isOptional: false, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 4
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: false, name: 'A_B.C' },
        group: null,
        type: null
      }, { // 5
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: true, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 6
        description: ['This is a description'],
        field: { defaultValue: 'A', isOptional: true, name: 'A_B.C' },
        group: null,
        type: null,
      }, { // 7
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C' },
        group: null,
        type: null
      }, { // 8
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: 'groupA',
        type: null,
      }, { // 9
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: null,
        type: { allowedValues: [], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 10
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: null,
        type: { allowedValues: ['A', 'B', 'C'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 11
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: null,
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 12
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C' },
        group: 'groupA',
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 13
        description: ['This is a description'],
        field: { defaultValue: undefined, isOptional: false, name: 'A_B.C' },
        group: 'isNotTyped',
        type:null,
      }],
      paramGroup: {
        null: { isTyped: true, list: [ 0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11 ]},
        groupA: { isTyped: true, list: [ 8, 12 ] },
        isNotTyped: { isTyped: false, list: [ 13 ]},
      },
      paramGroupVariant: {
        "null": {
          "isTyped": true,
          "prop": {
            "A_B": [
              {
                "list": [
                  0
                ],
                "parent": 0,
                "prop": {
                  "C": [
                    {
                      "list": [
                        0
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        1
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        2
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        3
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        4
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        5
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        6
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        7
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        9
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        10
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        11
                      ],
                      "parent": null,
                      "prop": {}
                    }
                  ]
                }
              }
            ]
          }
        },
        "groupA": {
          "isTyped": true,
          "prop": {
            "A_B": [
              {
                "list": [
                  8
                ],
                "parent": 8,
                "prop": {
                  "C": [
                    {
                      "list": [
                        8
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        12
                      ],
                      "parent": null,
                      "prop": {}
                    }
                  ]
                }
              }
            ]
          }
        },
        "isNotTyped": {
          "isTyped": false,
          "prop": {
            "A_B": [
              {
                "list": [
                  13
                ],
                "parent": 13,
                "prop": {
                  "C": [
                    {
                      "list": [
                        13
                      ],
                      "parent": null,
                      "prop": {}
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    });
  });

  it('should parse multiple params prefixed by @apiParamPrefix', () => {
    const lines = [
      '@apiParamPrefix prefix.',
      '@apiParam A_B.C',
    ];

    expect(parser.parseBlockLines(lines).param).toEqual([
      {
        description: [],
        field: { defaultValue: undefined, isOptional: false, name: 'prefix.A_B.C' },
        group: null,
        type: null,
      }
    ]);
  });
});
