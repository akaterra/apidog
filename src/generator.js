const fs = require('fs');
const handlebars = require('handlebars');

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
          return !! config.private;
        }
      }
    }

    return config ? ! config.private : true;
  });

  const sections = generateSections(blocks, config);

  const templateParams = {
    blocks,
    config: config || {},
    description: config && config.description || 'No description',
    groups: sections,
    groupsAsLists: Object.keys(sections).map((group) => {
      return {
        subgroups: Object.keys(sections[group]).map((subgroup) => {
          return {
            names: Object.keys(sections[group][subgroup]).map((name) => {
              return Object.keys(sections[group][subgroup][name]).sort().map((version) => {
                return sections[group][subgroup][name][version];
              });
            }),
            title: subgroup,
          };
        }),
        title: group,
      }
    }),
    sections: Object.keys(sections).reduce((acc, group) => {
      Object.keys(sections[group]).forEach((subgroup) => {
        Object.keys(sections[group][subgroup]).map((name) => {
          Object.keys(sections[group][subgroup][name]).forEach((version) => {
            acc[sections[group][subgroup][name][version].id] = sections[group][subgroup][name][version];
          });
        });
      });

      return acc;
    }, {}),
    title: config && config.title || 'No title',
  };

  handlebars.registerHelper('hook', (op, ...args) => {
    const options = args.pop();

    switch (op) {
      case 'isNotContainerType':
        return args[0].toLowerCase() !== 'array' && args[0].toLowerCase() !== 'object'
          ? options.fn(this)
          : options.inverse(this);

      default:
        return options.fn(this);
    }
  });

  return (hbs || handlebars).compile(template)(templateParams);
}

function generateSections(blocks, config) {
  const definitions = {};

  blocks.forEach((block) => {
    if (block.define) {
      definitions[block.define.name] = block;
    }
  });

  const groups = {};

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

    if (! block.api) {
      // throw new Error('@api is not defined');
      return;
    }

    if (! block.contentType) {
      block.contentType = ['form'];
    }

    if (! block.group) {
      block.group = '$';
    }

    if (! groups[block.group]) {
      groups[block.group] = {}; // {section: [{}]>}
    }

    if (! block.sampleRequest) {
      block.sampleRequest = [block.api.endpoint];
    }

    if (! block.subgroup) {
      block.subgroup = '$';
    }

    if (! groups[block.group][block.subgroup]) {
      groups[block.group][block.subgroup] = {}; // {section: [{}]>}
    }

    if (! block.version) {
      block.version = '0.0.1';
    }

    if (! block.name) {
      block.name = `${block.api.endpoint}:${Object.values(block.api.transport || {}).join('_')}`;
    }

    if (! groups[block.group][block.subgroup][block.name]) {
      groups[block.group][block.subgroup][block.name] = {}; // {section: [{}]>}
    }

    if (! block.title) {
      block.title = block.api.endpoint;
    }

    block.familyId = `${block.group}_${block.subgroup}_${block.name}`;
    block.id = `${block.group}_${block.subgroup}_${block.name}_${block.version}`;

    if (block.validate) {
      block = block.validate(block, config);
    }

    groups[block.group][block.subgroup][block.name][block.version] = block;
  });

  return groups;
}

module.exports = {
  generate,
  generateSections,
};
