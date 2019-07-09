const handlebars = require('handlebars');

function generate(blocks, template, config, templateProcessor, hbs) {
  blocks = blocks.filter((block) => {
    if (block.private) {
      if (config) {
        if (Array.isArray(block.private)) {
          if (config.private === true) {
            return true;
          }

          if (Array.isArray(config.private)) {
            return config.private.every((key) => block.private.indexOf(key) !== -1);
          }

          return false;
        } else {
          return !! config.private;
        }
      }
    }

    return config ? ! config.private : true;
  });

  const [definitions, chapters] = generateSections(blocks, config);

  const templateParams = {
    author: config && config.author,
    blocks,
    chapters,
    chaptersAsLists: Object.entries(chapters).map(([chapterName, chapter]) => {
      return {
        groups: Object.entries(chapter).map(([groupName, group]) => {
          return {
            subgroups: Object.entries(group).map(([subgroupName, subgroup]) => {
              return {
                names: Object.values(subgroup).map((name) => {
                  return Object.keys(name).sort().map((version) => name[version]);
                }),
                title: subgroupName,
              }
            }),
            title: groupName,
          }
        }),
        title: chapterName,
      }
    }),
    config: config || {},
    definitions,
    description: config && config.description || 'No description',
    keywords: config && config.keywords || [],
    sections: Object.values(chapters).reduce((acc, chapter) => {
      Object.values(chapter).forEach((group) => {
        Object.values(group).forEach((subgroup) => {
          Object.values(subgroup).map((name) => {
            Object.values(name).forEach((version) => {
              acc[version.id] = version;
            });
          });
        });
      });

      return acc;
    }, {}),
    title: config && config.title || 'No title',
    version: config && config.version || '0.0.1',
  };

  hbs.registerHelper('context', (name) => templateParams[name]);

  if (templateProcessor) {
    return templateProcessor(hbs || handlebars, config, templateParams);
  }

  return (hbs || handlebars).compile(template)(templateParams);
}

function generateSections(blocks, config) {
  const definitions = {};

  blocks.forEach((block) => {
    if (block.define) {
      definitions[block.define.name] = block.define;
    }
  });

  const chapters = {};

  blocks.forEach((block, index) => {
    if (block.define || block.ignore) {
      return;
    }

    // if (block.use) {
    //   for (const use of block.use) {
    //     if (! definitions[use]) {
    //       throw new Error(`@apiUse refers to unknown @apiDefine: ${use}`);
    //     }
    //
    //     Object.keys(definitions[use]).forEach((key) => {
    //       if (key !== 'define') {
    //         if (! block[key]) {
    //           block[key] = definitions[use][key];
    //         }
    //       }
    //     });
    //   }
    // }

    if (! block.chapter) {
      block.chapter = '$';
    }

    if (! block.contentType) {
      block.contentType = ['form'];
    }

    if (! block.group) {
      block.group = {description: [], name: '$', title: null};
    }

    if (! chapters[block.chapter]) {
      chapters[block.chapter] = {}; // {section: [{}]>}
    }

    if (! chapters[block.chapter][block.group.name]) {
      chapters[block.chapter][block.group.name] = {}; // {section: [{}]>}
    }

    if (! block.sampleRequest) {
      block.sampleRequest = [block.api.endpoint];
    }

    if (! block.subgroup) {
      block.subgroup = '$';
    }

    if (! chapters[block.chapter][block.group.name][block.subgroup]) {
      chapters[block.chapter][block.group.name][block.subgroup] = {}; // {section: [{}]>}
    }

    if (! block.version) {
      block.version = '0.0.1';
    }

    if (! block.name) {
      block.name = `${block.api.endpoint}__${Object.values(block.api.transport || {}).join('_')}`;
    }

    if (! chapters[block.chapter][block.group.name][block.subgroup][block.name]) {
      chapters[block.chapter][block.group.name][block.subgroup][block.name] = {}; // {section: [{}]>}
    }

    if (! block.title) {
      block.title = block.api.endpoint;
    }

    block.familyId = `${block.chapter}_${block.group.name}_${block.subgroup}_${block.name}`;
    block.id = `${block.chapter}_${block.group.name}_${block.subgroup}_${block.name}_${block.version}`;

    if (block.validate) {
      block = block.validate(block, config);
    }

    chapters[block.chapter][block.group.name][block.subgroup][block.name][block.version] = block;
  });

  return [definitions, chapters];
}

module.exports = {
  generate,
  generateSections,
};
