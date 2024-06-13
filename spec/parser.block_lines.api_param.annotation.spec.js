const parser = require('../src/parser.block_lines');

describe('parser.block_lines parseBlockLines @apiParam annotation', () => {
  beforeEach(function () {
    jasmine.addMatchers(require('jasmine-diff')(jasmine, {}));
  });

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
      '@apiParam A_B[D]',
      '@apiParam [A_B[D]] This is a description',
      '@apiParam {typeA{1..3}="A,B,C","D,E,F","G,H,I"} A_B.C This is a description',
      '@apiParam (groupA) {typeA{1-3}="A,B,C","D,E,F","G,H,I"} [A_B.C="A B C"] This is a description',
      '@apiParam {typeA{..3}="A,B,C","D,E,F","G,H,I"} A_B.C This is a description',
      '@apiParam (groupA) {typeA{-+3}="A,B,C","D,E,F","G,H,I"} [A_B.C="A B C"] This is a description',
      '@apiParam {typeA{1..}="A,B,C","D,E,F","G,H,I"} A_B.C This is a description',
      '@apiParam (groupA) {typeA{1-}="A,B,C","D,E,F","G,H,I"} [A_B.C="A B C"] This is a description',
    ];

    expect(parser.parseBlockLines(lines).toObject()).toEqual({
      param: [{ // 0
        description: [],
        field: { isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: null,
      }, { // 1
        description: ['This is a description'],
        field: { isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: null,
      }, { // 2
        description: ['This is a description', 'Some description'],
        field: { isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: null,
      }, { // 3
        description: ['This is a description'],
        field: { defaultValue: 'A', isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: null,
      }, { // 4
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: null
      }, { // 5
        description: ['This is a description'],
        field: { isOptional: true, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: null,
      }, { // 6
        description: ['This is a description'],
        field: { defaultValue: 'A', isOptional: true, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: null,
      }, { // 7
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: null
      }, { // 8
        description: ['This is a description'],
        field: { isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: 'groupA',
        type: null,
      }, { // 9
        description: ['This is a description'],
        field: { isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: { allowedValues: [], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 10
        description: ['This is a description'],
        field: { isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: { allowedValues: ['A', 'B', 'C'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 11
        description: ['This is a description'],
        field: { isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 12
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: 'groupA',
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true }, name: 'typeA' },
      }, { // 13
        description: ['This is a description'],
        field: { isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: 'isNotTyped',
        type:null,
      }, { // 14
        description: [],
        field: { isOptional: false, name: 'A_B[D]', path: [ 'A_B', 'D' ] },
        group: null,
        type: null,
      }, { // 15
        description: ['This is a description'],
        field: { isOptional: true, name: 'A_B[D]', path: [ 'A_B', 'D' ] },
        group: null,
        type: null,
      }, { // 16
        description: ['This is a description'],
        field: { isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true, isNumericRange: false, min: 1, max: 3 }, name: 'typeA' },
      }, { // 17
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: 'groupA',
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true, isNumericRange: true, min: 1, max: 3 }, name: 'typeA' },
      }, { // 18
        description: ['This is a description'],
        field: { isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true, isNumericRange: false, min: null, max: 3 }, name: 'typeA' },
      }, { // 19
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: 'groupA',
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true, isNumericRange: true, min: null, max: 3 }, name: 'typeA' },
      }, { // 18
        description: ['This is a description'],
        field: { isOptional: false, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: null,
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true, isNumericRange: false, min: 1, max: null }, name: 'typeA' },
      }, { // 19
        description: ['This is a description'],
        field: { defaultValue: 'A B C', isOptional: true, name: 'A_B.C', path: [ 'A_B', 'C' ] },
        group: 'groupA',
        type: { allowedValues: ['A,B,C', 'D,E,F', 'G,H,I'], modifiers: { initial: 'typea', typea: true, isNumericRange: true, min: 1, max: null }, name: 'typeA' },
      }],
      paramGroup: {
        null: { isTyped: true, list: [ 0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 14, 15, 16, 18, 20 ]},
        groupA: { isTyped: true, list: [ 8, 12, 17, 19, 21 ] },
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
                    },
                    {
                      "list": [
                        16
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        18
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        20
                      ],
                      "parent": null,
                      "prop": {}
                    }
                  ],
                  "D": [
                    {
                      "list": [
                        14
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        15
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
                    },
                    {
                      "list": [
                        17
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        19
                      ],
                      "parent": null,
                      "prop": {}
                    },
                    {
                      "list": [
                        21
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

    expect(parser.parseBlockLines(lines).param).toEqual([{
      description: [],
      field: { defaultValue: undefined, isOptional: false, name: 'prefix.A_B.C', path: [ 'prefix', 'A_B', 'C' ] },
      group: null,
      type: null,
    }]);
  });
});
