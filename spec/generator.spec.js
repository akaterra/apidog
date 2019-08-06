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
    const blocks = [
      {
        api: {}, group: 'A', name: 'A', subgroup: 'A', title: 'A', version: '1',
      },
      {
        api: {}, group: 'A', name: 'A', subgroup: 'A', title: 'A', version: '2',
      },
      {
        api: {}, group: 'A', name: 'B', subgroup: 'A', title: 'B', version: '1',
      },
      {
        api: {}, group: 'B', name: 'A', subgroup: 'B', title: 'A', version: '1',
      },
      {
        api: {}, group: 'B', name: 'A', subgroup: 'B', title: 'A', version: '2',
      },
      {
        api: {}, group: 'B', name: 'B', subgroup: 'B', title: 'B', version: '1',
      },
    ];

    expect(generator.generateSections(blocks)).toEqual({
      A: {
        A: {
          A: { '1': blocks[0], '2': blocks[1] },
          B: { '1': blocks[2] },
        },
      },
      B: {
        B: {
          A: { '1': blocks[3], '2': blocks[4] },
          B: { '1': blocks[5]},
        },
      },
    });
  });

  it('should generate sections filling default group', () => {
    const blocks = [
      {
        api: {},
        name: 'name',
        title: 'title',
        version: 'version',
      },
    ];

    expect(generator.generateSections(blocks)).toEqual({
      $: {
        $: {
          name: { version: Object.assign({group: 'default'}, blocks[0]) },
        },
      },
    });
  });

  fit('should generate sections filling default version', () => {
    const blocks = [
      {
        api: {
          endpoint: 'endpoint',
        },
      },
    ];

    expect(generator.generateSections(blocks).$.$.$.endpoint_['0.0.1'].version).toEqual('0.0.1');
  });

  // it('should generate sections filling defaults from use', () => {
  //   const blocks = [
  //     {
  //       define: {
  //         description: ['default description'],
  //         name: 'default name',
  //         title: 'default title',
  //       },
  //       description: ['default description'],
  //       title: 'default title',
  //     },
  //     {
  //       api: {},
  //       group: 'group',
  //       name: 'name',
  //       title: 'title',
  //       use: ['default name'],
  //     },
  //   ];
  //
  //   expect(generate.generateSections(blocks)).toEqual({
  //     group: {
  //       name: {
  //         '0.0.1': {
  //           api: {},
  //           description: ['default description'],
  //           group: 'group',
  //           id: 'group_0.0.1_name',
  //           name: 'name',
  //           title: 'title',
  //           use: ['default name'],
  //           version: '0.0.1',
  //         },
  //       },
  //     }
  //   });
  // });

  it('should generate sections skipping "ignore" blocks', () => {
    const blocks = [{ ignore: true }];

    expect(generator.generateSections(blocks)).toEqual({});
  });

  // it('should raise exception on unknown use', () => {
  //   const blocks = [{ api: {}, use: ['unknown'] }];
  //
  //   expect(() => generate.generateSections(blocks)).toThrow();
  // });
});
