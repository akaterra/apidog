const fastSort = require('fast-sort');
const handlebars = require('handlebars');
const parserUtils = require('./parser.utils');

function generate(blocks, template, config, hbs) {
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

  let [definitions, chapters] = generateSections(blocks, config);

  if (config.templateProcessor && config.templateProcessor.prepareChapters) {
    chapters = config.templateProcessor.prepareChapters(chapters);
  }

  const total = {
    names: 0,
    notes: 0,
  }

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
                apis: Object.entries(subgroup).map(([name, version]) => {
                  total.names += 1;

                  return Object.values(version).filter((version) => version.api);
                }).filter((apis) => apis.length),
                notes: Object.entries(subgroup).map(([name, version]) => {
                  total.notes += 1;

                  return Object.values(version).filter((version) => version.note);
                }).filter((notes) => notes.length),
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
    contentTypes: parserUtils.enumChapters(chapters, ({descriptor}, acc) => {
      descriptor.contentType.forEach((contentType) => {
        acc[contentType] = contentType;
      });
    }, {}),
    definitions,
    description: config && config.description || 'No description',
    families: Object.values(chapters).reduce((acc, chapter) => {
      Object.values(chapter).forEach((group) => {
        Object.values(group).forEach((subgroup) => {
          Object.values(subgroup).forEach((name) => {
            Object.values(name).forEach((version) => {
              acc[version.familyId] = [version.version].concat(acc[version.familyId] || []);
            });
          });
        });
      });

      return acc;
    }, {}),
    keywords: config && config.keywords || [],
    sections: parserUtils.enumChapters(chapters, ({descriptor}, acc) => {
      acc[descriptor.id] = descriptor;
    }, {}),
    // sections: Object.values(chapters).reduce((acc, chapter) => {
    //   Object.values(chapter).forEach((group) => {
    //     Object.values(group).forEach((subgroup) => {
    //       Object.values(subgroup).forEach((name) => {
    //         Object.values(name).forEach((version) => {
    //           acc[version.id] = version;
    //         });
    //       });
    //     });
    //   });

    //   return acc;
    // }, {}),
    schemes: Object.values(chapters).reduce((acc, chapter) => {
      Object.values(chapter).forEach((group) => {
        Object.values(group).forEach((subgroup) => {
          Object.values(subgroup).forEach((name) => {
            Object.values(name).forEach((version) => {
              if (version.api) {
                acc[version.api.transport.name] = version.api.transport.name;
              }
            });
          });
        });
      });

      return acc;
    }, {}),
    total,
    versions: Object.values(chapters).reduce((acc, chapter) => {
      Object.values(chapter).forEach((group) => {
        Object.values(group).forEach((subgroup) => {
          Object.values(subgroup).forEach((name) => {
            Object.values(name).forEach((version) => {
              acc[version.version] = [version.familyId].concat(acc[version.version] || []);
            });
          });
        });
      });

      return acc;
    }, {}),
    templateOptions: config && config.templateOptions || {},
    title: config && config.title || 'No title',
    version: config && config.version || '0.0.1',
  };

  hbs.registerHelper('context', (name) => templateParams[name]);

  if (config.templateProcessor) {
    return config.templateProcessor.generate(hbs || handlebars, config, templateParams);
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
    if (block.define || block.ignore || (!block.api && !block.note)) {
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

    if (!block.family && !block.note) {
      block.family = `${block.api.endpoint}__${Object.values(block.api.transport || {}).join('_')}`;
    }

    if (!block.params) {
      block.params = [];
    }

    // if (!block.sampleRequest) {
    //   block.sampleRequest = [block.api.endpoint];
    // }

    if (!block.subgroup) {
      block.subgroup = {description: [], name: '$', title: null};
    }

    if (!block.version) {
      block.version = '0.0.1';
    }

    if (!block.title && !block.note) {
      block.title = block.api.endpoint;
    }

    if (!block.name) {
      block.name = block.title;
    }

    if (config && config.ordered) {
      if (block.chapter.title) {
        block.chapter.title = block.chapter.title.replace(/^(\d+\.)+\s+/, expandTitleOrder);
      }

      if (block.group.title) {
        block.group.title = block.group.title.replace(/^(\d+\.)+\s+/, expandTitleOrder);
      }

      if (block.subgroup.title) {
        block.subgroup.title = block.subgroup.title.replace(/^(\d+\.)+\s+/, expandTitleOrder);
      }

      if (block.title) {
        block.title = block.title.replace(/^(\d+\.)+\s+/, expandTitleOrder);
      }
    }

    block.familyId = `${block.chapter.name}_${block.group.name}_${block.subgroup.name}_${block.family}`;
    block.id = `${block.chapter.name}_${block.group.name}_${block.subgroup.name}_${block.family}_${block.version}`;
    block.visualId = `${getDef(block.chapter.name)}_${getDef(block.group.name)}_${getDef(block.subgroup.name)}_${block.title}_${block.version}`;

    if (block.validate) {
      blocks[index] = block.validate(block, config);
    }
  });

  const sections = fastSort(blocks).asc((block) => block.visualId).reduce((sections, block) => {
    if (block.define || block.ignore || (!block.api && !block.note)) {
      return sections;
    }

    if (!sections[block.chapter.name]) {
      sections[block.chapter.name] = {};
    }

    if (!sections[block.chapter.name][block.group.name]) {
      sections[block.chapter.name][block.group.name] = {};
    }

    if (!sections[block.chapter.name][block.group.name][block.subgroup.name]) {
      sections[block.chapter.name][block.group.name][block.subgroup.name] = {};
    }

    if (!sections[block.chapter.name][block.group.name][block.subgroup.name][block.family]) {
      sections[block.chapter.name][block.group.name][block.subgroup.name][block.family] = {};
    }

    sections[block.chapter.name][block.group.name][block.subgroup.name][block.family][block.version] = block;

    if (config && config.ordered) {
      if (block.chapter.title) {
        block.chapter.title = block.chapter.title.replace(/^(\d+\.)+\s+/, '');
      }

      if (block.group.title) {
        block.group.title = block.group.title.replace(/^(\d+\.)+\s+/, '');
      }

      if (block.subgroup.title) {
        block.subgroup.title = block.subgroup.title.replace(/^(\d+\.)+\s+/, '');
      }

      if (block.title) {
        block.title = block.title.replace(/^(\d+\.)+\s+/, '');
      }
    }

    return sections;
  }, {});

  if (config && config.ordered) {
    Object.values(definitions).forEach((definition) => {
      if (definition.title) {
        definition.title = definition.title.replace(/^(\d+\.)+\s+/, '');
      }
    });
  }

  return [definitions, sections];
}

function expandTitleOrder(title) {
  return title.replace(/(\d+\.)/g, (order) => {
    return '0'.repeat(4 - order.length + 1) + order.slice(0, -1) + '.';
  });
}

module.exports = {
  generate,
  generateSections,
};
