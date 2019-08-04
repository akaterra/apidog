const HtmlDiff = (function () {
  const module = {};

  {{> htmldiff.js }}

  return module.exports.default;
})();

const chapters = {{toJson this.chapters}};
const config = {{toJson this.config}};
const definitions = {{toJson this.definitions}};
const sections = {{toJson this.sections}};

{{> compile_body_form.js }}
{{> compile_body_xml.js }}
{{> prepare_body.js }}

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

  const templateParams = {
    chapters: chapters,
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
  };

  Handlebars.registerHelper('context', (name) => templateParams[name]);

  const html = Handlebars.compile(templateContent)(templateParams);

  document.body.innerHTML = html;

  {{> main.element.js }}
  {{> main.element.selector.js }}
  {{> main.event_emitter.js }}
  {{> main.func.js }}
  {{> main.js }}
  {{> main.request.js }}
  {{> ssr.js }}
  {{> ssr.hook.js }}
  {{> ssr.preset.js }}
  {{> ssr.variable.js }}
};
