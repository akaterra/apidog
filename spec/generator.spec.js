const generator = require('../src/generator');

const hbs = () => {
  const hbsInstance = {
    compile: (template) => {
      hbsInstance.template = template;

      return (params) => {
        hbsInstance.params = params;

        return '';
      }
    },
    registerHelper(name, fn) {

    },
  };

  return hbsInstance;
};

describe('generator', () => {
  it('should generate with public filtering', () => {
    const blocks = [
      {
        $id: 0, api: {}, private: true,
      },
      {
        $id: 1, api: {}, private: false,
      },
      {
        $id: 2, api: {}, private: ['a', 'b', 'c'],
      },
      {
        $id: 3, api: {}, private: ['a'],
      },
      {
        $id: 4, api: {},
      },
    ];
    const handlebars = hbs();

    generator.generate(blocks, '', {}, handlebars);

    expect(handlebars.params.blocks.map((block) => block.$id)).toEqual([1, 4]);
  });

  it('should generate with private filtering', () => {
    const blocks = [
      {
        $id: 0, api: {}, private: true,
      },
      {
        $id: 1, api: {}, private: false,
      },
      {
        $id: 2, api: {}, private: ['a', 'b', 'c'],
      },
      {
        $id: 3, api: {}, private: ['a'],
      },
      {
        $id: 4, api: {},
      },
    ];
    const handlebars = hbs();

    generator.generate(blocks, '', {private: true}, handlebars);

    expect(handlebars.params.blocks.map((block) => block.$id)).toEqual([0, 2, 3]);
  });

  it('should generate with private filtering of slices', () => {
    const blocks = [
      {
        $id: 0, api: {}, private: true,
      },
      {
        $id: 1, api: {}, private: false,
      },
      {
        $id: 2, api: {}, private: ['a', 'b', 'c'],
      },
      {
        $id: 3, api: {}, private: ['a'],
      },
      {
        $id: 4, api: {},
      },
    ];
    const handlebars = hbs();

    generator.generate(blocks, '', {private: ['a', 'b']}, handlebars);

    expect(handlebars.params.blocks.map((block) => block.$id)).toEqual([0, 2]);
  });
});

describe('generate sections', () => {
  it('should generate sections', () => {
    const A = {
      name: 'A',
    };
    const B = {
      name: 'B',
    };
    const blocks = [
      {
        api: {endpoint: 'endpoint'}, chapter: A, group: A, name: 'A', subgroup: A, title: 'A', version: '1',
      },
      {
        api: {}, chapter: A, family: 'a', group: A, name: 'A', subgroup: B, title: 'A', version: '2',
      },
      {
        api: {}, chapter: A, family: 'b', group: B, name: 'B', subgroup: B, title: 'B', version: '1',
      },
      {
        api: {endpoint: 'endpoint'}, chapter: B, group: A, name: 'A', subgroup: A, title: 'A', version: '1',
      },
      {
        api: {}, chapter: B, family: 'a', group: B, name: 'A', subgroup: A, title: 'A', version: '2',
      },
      {
        api: {}, chapter: B, family: 'b', group: B, name: 'B', subgroup: B, title: 'B', version: '1',
      },
    ];

    const [definitions, sections] = generator.generateSections(blocks);

    expect(sections).toEqual({

      // chapter A
      A: {

        // group A
        A: {
          A: {
            endpoint__: {
              1: {
                api: {endpoint: 'endpoint'},
                chapter: A,
                contentType: ['form'],
                family: 'endpoint__',
                familyId: 'A_A_A_endpoint__',
                group: A,
                id: 'A_A_A_endpoint___1',
                name: 'A',
                subgroup: A,
                title: 'A',
                version: '1',
                visualId: 'A_A_A_A_1',
              },
            },
          },
          B: {
            a: {
              2: {
                api: {},
                chapter: A,
                contentType: ['form'],
                family: 'a',
                familyId: 'A_A_B_a',
                group: A,
                id: 'A_A_B_a_2',
                name: 'A',
                subgroup: B,
                title: 'A',
                version: '2',
                visualId: 'A_A_B_A_2',
              },
            },
          },
        },

        // group B
        B: {
          B: {
            b: {
              1: {
                api: {},
                chapter: A,
                contentType: ['form'],
                family: 'b',
                familyId: 'A_B_B_b',
                group: B,
                id: 'A_B_B_b_1',
                name: 'B',
                subgroup: B,
                title: 'B',
                version: '1',
                visualId: 'A_B_B_B_1',
              },
            },
          },
        },
      },

      // chapter B
      B: {

        // group A
        A: {
          A: {
            endpoint__: {
              1: {
                api: {endpoint: 'endpoint'},
                chapter: B,
                contentType: ['form'],
                family: 'endpoint__',
                familyId: 'B_A_A_endpoint__',
                group: A,
                id: 'B_A_A_endpoint___1',
                name: 'A',
                subgroup: A,
                title: 'A',
                version: '1',
                visualId: 'B_A_A_A_1',
              },
            },
          },
        },

        // group B
        B: {
          A: {
            a: {
              2: {
                api: {},
                chapter: B,
                contentType: ['form'],
                family: 'a',
                familyId: 'B_B_A_a',
                group: B,
                id: 'B_B_A_a_2',
                name: 'A',
                subgroup: A,
                title: 'A',
                version: '2',
                visualId: 'B_B_A_A_2',
              },
            },
          },
          B: {
            b: {
              1: {
                api: {},
                chapter: B,
                contentType: ['form'],
                family: 'b',
                familyId: 'B_B_B_b',
                group: B,
                id: 'B_B_B_b_1',
                name: 'B',
                subgroup: B,
                title: 'B',
                version: '1',
                visualId: 'B_B_B_B_1',
              },
            },
          },
        },
      },
    });
  });

  it('should generate sections filling default chapter', () => {
    const blocks = [
      {
        api: {
          endpoint: 'endpoint',
        },
      },
    ];

    const [definitions, sections] = generator.generateSections(blocks);

    expect(sections.$.$.$.endpoint__['0.0.1'].chapter).toEqual({description: [], name: '$', title: null});
  });

  it('should generate sections filling default group', () => {
    const blocks = [
      {
        api: {
          endpoint: 'endpoint',
        },
      },
    ];

    const [definitions, sections] = generator.generateSections(blocks);

    expect(sections.$.$.$.endpoint__['0.0.1'].group).toEqual({description: [], name: '$', title: null});
  });

  it('should generate sections filling default subgroup', () => {
    const blocks = [
      {
        api: {
          endpoint: 'endpoint',
        },
      },
    ];

    const [definitions, sections] = generator.generateSections(blocks);

    expect(sections.$.$.$.endpoint__['0.0.1'].subgroup).toEqual({description: [], name: '$', title: null});
  });

  it('should generate sections filling default version', () => {
    const blocks = [
      {
        api: {
          endpoint: 'endpoint',
        },
      },
    ];

    const [definitions, sections] = generator.generateSections(blocks);

    expect(sections.$.$.$.endpoint__['0.0.1'].version).toEqual('0.0.1');
  });

  it('should generate sections skipping "ignore" blocks', () => {
    const blocks = [{ ignore: true }];

    const [definitions, sections] = generator.generateSections(blocks);

    expect(sections).toEqual({});
  });

  // it('should raise exception on unknown use', () => {
  //   const blocks = [{ api: {}, use: ['unknown'] }];
  //
  //   expect(() => generate.generateSections(blocks)).toThrow();
  // });
});
