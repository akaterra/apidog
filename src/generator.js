const fastSort = require('fast-sort');
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
          return !!config.private;
        }
      }
    }

    return config ? !config.private : true;
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
                names: Object.entries(subgroup).map(([name, version]) => {
                  return Object.values(version);
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
          Object.values(subgroup).forEach((name) => {
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

  function getDef(name) {
    return definitions[name]
      ? definitions[name].title
      : name;
  }

  blocks.forEach((block) => {
    if (block.define) {
      definitions[block.define.name] = block.define;
    }
  });

  blocks.forEach((block, index) => {
    if (block.define || block.ignore || !block.api) {
      return;
    }

    if (!block.chapter) {
      block.chapter = {description: [], name: '$', title: null};
    }

    if (!block.contentType) {
      block.contentType = ['form'];
    }

    if (!block.group) {
      block.group = {description: [], name: '$', title: null};
    }

    if (!block.sampleRequest) {
      block.sampleRequest = [block.api.endpoint];
    }

    if (!block.subgroup) {
      block.subgroup = {description: [], name: '$', title: null};
    }

    if (!block.version) {
      block.version = '0.0.1';
    }

    if (!block.name) {
      block.name = `${block.api.endpoint}__${Object.values(block.api.transport || {}).join('_')}`;
    }

    if (!block.title) {
      block.title = block.api.endpoint;
    }

    block.familyId = `${block.chapter.name}_${block.group.name}_${block.subgroup.name}_${block.name}`;
    block.id = `${block.chapter.name}_${block.group.name}_${block.subgroup.name}_${block.name}_${block.version}`;
    block.visualId = `${getDef(block.chapter.name)}_${getDef(block.group.name)}_${getDef(block.subgroup.name)}_${block.title}_${block.version}`;

    if (block.validate) {
      blocks[index] = block.validate(block, config);
    }
  });

  const sections = fastSort(blocks).asc((block) => block.visualId).reduce((sections, block) => {
    if (block.define || block.ignore || !block.api) {
      return sections;
    }

    if (!sections[block.chapter.name]) {
      sections[block.chapter.name] = {}; // {section: [{}]>}
    }

    if (!sections[block.chapter.name][block.group.name]) {
      sections[block.chapter.name][block.group.name] = {}; // {section: [{}]>}
    }

    if (!sections[block.chapter.name][block.group.name][block.subgroup.name]) {
      sections[block.chapter.name][block.group.name][block.subgroup.name] = {}; // {section: [{}]>}
    }

    if (!sections[block.chapter.name][block.group.name][block.subgroup.name][block.name]) {
      sections[block.chapter.name][block.group.name][block.subgroup.name][block.name] = {}; // {section: [{}]>}
    }

    sections[block.chapter.name][block.group.name][block.subgroup.name][block.name][block.version] = block;

    return sections;
  }, {});

  return [definitions, sections];
}

module.exports = {
  generate,
  generateSections,
};
