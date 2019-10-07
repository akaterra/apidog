const fs = require('fs');
const handlebars = require('handlebars');

module.exports = (config) => ({
  generate(hbs, config, params) {
    const outputDir = config.outputDir;

    // const apidocHtmlTemplate = fs.readFileSync(`${__dirname}/template.2.0.hbs`, {encoding: 'utf8'});
    // fs.writeFileSync(`${outputDir}/swagger.json`, handlebars.compile(apidocHtmlTemplate)(params));

    const spec = {
      swagger: '2.0',
      info: {
        title: params.title,
        description: params.description,
        version: params.version,
      },
      basePath: '/',
      schemes: Object.values(params.schemes),
      paths: {},
    };

    Object.entries(params.chaptersAsLists).forEach(([chapterName, chapter]) => {
      Object.entries(chapter).forEach(([groupName, group]) => {
        Object.entries(group).forEach(([subgroupName, subgroup]) => {
          Object.entries(subgroup).forEach(([name, version]) => {
            console.log(version[0]);
            Object.entries(version).forEach(([versionName, descriptor]) => {
            });
          });
        });
      });
    });

    fs.writeFileSync(`${outputDir}/swagger2.json`, JSON.stringify(spec, undefined, 2));
  },
  prepareChapters(chapters) {
    const newChapters = {};

    Object.entries(chapters).forEach(([chapterName, chapter]) => {
      Object.entries(chapter).forEach(([groupName, group]) => {
        Object.entries(group).forEach(([subgroupName, subgroup]) => {
          Object.entries(subgroup).forEach(([name, version]) => {
            Object.entries(version).forEach(([versionName, descriptor]) => {
              if (!newChapters[chapterName]) {
                newChapters[chapterName] = {};
              }

              if (!newChapters[chapterName][groupName]) {
                newChapters[chapterName][groupName] = {};
              }

              if (!newChapters[chapterName][groupName][subgroupName]) {
                newChapters[chapterName][groupName][subgroupName] = {};
              }

              if (!newChapters[chapterName][groupName][subgroupName][descriptor.api.endpoint]) {
                newChapters[chapterName][groupName][subgroupName][descriptor.api.endpoint] = {};
              }

              newChapters[chapterName][groupName][subgroupName][descriptor.api.endpoint][versionName] = descriptor;
            });
          });
        });
      });
    });

    return newChapters;
  },
});
