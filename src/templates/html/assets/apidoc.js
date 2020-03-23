const HtmlDiff = (function () {
  const module = {};

  {{> htmldiff.js }}

  return module.exports.default;
})();

{{> main.func.js }}
{{> compile_body_form.js }}
{{> compile_body_xml.js }}
{{> ssr.prepare_body.js }}
{{> ssr.prepare_url.js }}

window.onload = () => {
  window.module = {};

  {{> first.js }}
  Handlebars.registerHelper('first', module.exports);

  {{> hook.js }}
  Handlebars.registerHelper('hook', module.exports);

  {{> if_cond.js }}
  Handlebars.registerHelper('ifCond', module.exports);

  {{> join.js }}
  Handlebars.registerHelper('join', module.exports);

  {{> lookup.js }}
  Handlebars.registerHelper('lookup', module.exports);

  {{> path_last_key_indented.js }}
  Handlebars.registerHelper('pathLastKeyIndented', module.exports);

  {{> to_html.js }}
  Handlebars.registerHelper('toHtml', module.exports);

  {{> to_json.js }}
  Handlebars.registerHelper('toJson', module.exports);

  {{> to_lower_case.js }}
  Handlebars.registerHelper('toLowerCase', module.exports);

  {{> to_upper_case.js }}
  Handlebars.registerHelper('toUpperCase', module.exports);

  const qs = parseForm(document.location.search.substr(1));

  if (qs.locale) {
    config.locale = qs.locale;
  }

  const templateParams = {
    chapters: chapters,
    chaptersAsLists: Object.entries(chapters).map(([chapterName, chapter]) => {
      return {
        id: `${chapterName}`,
        groups: Object.entries(chapter).map(([groupName, group]) => {
          return {
            id: `${chapterName}___${groupName}`,
            subgroups: Object.entries(group).map(([subgroupName, subgroup]) => {
              return {
                id: `${chapterName}___${groupName}___${subgroupName}`,
                apis: Object.entries(subgroup).map(([name, version]) => {
                  return Object.values(version).filter((version) => version.api);
                }).filter((apis) => apis.length),
                notes: Object.entries(subgroup).map(([name, version]) => {
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
    definitions,
    description: config && config.description || 'No description',
    // sections: enumChapters(chapters, ({descriptor}, acc) => {
    //   acc[descriptor.id] = descriptor;
    // }, {}),
    // sections: Object.values(chapters).reduce((acc, chapter) => {
    //   Object.values(chapter).forEach((group) => {
    //     Object.values(group).forEach((subgroup) => {
    //       Object.values(subgroup).map((name) => {
    //         Object.values(name).forEach((version) => {
    //           acc[version.id] = version;
    //         });
    //       });
    //     });
    //   });

    //   return acc;
    // }, {}),
    versions: enumChapters(chapters, ({descriptor}, acc) => {
      acc[descriptor.version] = [descriptor.familyId].concat(acc[descriptor.version] || []);
    }, {}),
    // versions: Object.values(chapters).reduce((acc, chapter) => {
    //   Object.values(chapter).forEach((group) => {
    //     Object.values(group).forEach((subgroup) => {
    //       Object.values(subgroup).forEach((name) => {
    //         Object.values(name).forEach((version) => {
    //           acc[version.version] = [version.familyId].concat(acc[version.version] || []);
    //         });
    //       });
    //     });
    //   });

    //   return acc;
    // }, {}),
    templateOptions: {{toJson this.templateOptions}},
    title: config && config.title || 'No title',
  };

  Handlebars.registerHelper('context', (name) => templateParams[name]);
  Handlebars.registerHelper('_', (key) => _(config.locale || 'en', key));
  Handlebars.registerPartial('contentGroup', templateContentGroup);

  const html = Handlebars.compile(templateContent)(templateParams);

  document.body.innerHTML = html;

  {{> main.element.js }}
  {{> main.element.selector.js }}
  {{> main.event_emitter.js }}
  {{> main.js }}
  {{> main.request.js }}
  {{> ssr.js }}
  {{> ssr.hook.js }}
  {{> ssr.preset.js }}
  {{> ssr.variable.js }}

  if (getRtl(config.locale)) {
    cls.add('body', 'rtl');
  }

  main.jumpToByHash(document.location.hash.substr(1));
};

function enumChapters(chapters, fn, acc) {
  Object.entries(chapters).forEach(([chapterName, groups]) => {
    Object.entries(groups).forEach(([groupName, subgroups]) => {
      Object.entries(subgroups).forEach(([subgroupName, names]) => {
        Object.entries(names).forEach(([name, versions]) => {
          Object.entries(versions).forEach(([versionName, descriptor]) => {
            fn({
              chapterName,
              groups,
              groupName,
              subgroups,
              subgroupName,
              names,
              name,
              versions,
              versionName,
              descriptor,
            }, acc);
          });
        });
      });
    });
  });

  return acc;
}
