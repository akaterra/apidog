const fs = require('fs');
const generate = require('./src/generator');
const parse = require('./src/parser');

function parseArgs(args, defs) {
  let parsed = {};
  let lastArgName = null;

  args.forEach(function (arg) {
    let valueIndex = arg.indexOf('=');

    if (valueIndex !== - 1) {
      parsed[arg.substr(0, valueIndex).replace(/^-*/, '')] = arg.substr(valueIndex + 1);
    } else {
      if (lastArgName) {
        if (arg.substr(0, 1) === '-') {
          parsed[lastArgName] = true;
          lastArgName = arg.substr(1);
        } else if (arg.substr(0, 2) === '--') {
          parsed[lastArgName] = true;
          lastArgName = arg.substr(2);
        } else {
          parsed[lastArgName] = arg;
          lastArgName = null;
        }
      } else {
        lastArgName = arg.replace(/^-*/, '');
      }
    }
  });

  if (lastArgName) {
    parsed[lastArgName] = true;
  }

  if (defs) {
    Object.keys(defs).forEach((key) => {
      const [type, defaultValue] = Array.isArray(defs[key]) ? defs[key] : [null, defs[key]];

      if (! (key in parsed) && defaultValue !== void 0) {
        parsed[key] = defaultValue;
      }

      if (type === Boolean) {
        if (parsed[key] === 'true') {
          parsed[key] = true;
        }

        if (parsed[key] === 'false') {
          parsed[key] = false;
        }
      } else if (type === Number) {
        parsed[key] = parseInt(parsed[key]);
      }
    });
  }

  return parsed;
}

const args = parseArgs(process.argv.slice(2), {
  p: [Boolean],
  private: [Boolean],
});

const argsPrivate = args.p || args.private;

function loadConfig(dir) {
  let configApidoc = {};

  if (fs.existsSync(`${dir}/apidoc.json`)) {
    configApidoc = JSON.parse(fs.readFileSync(`${dir}/apidoc.json`, 'utf8'))
  } else if (fs.existsSync(`${process.cwd()}/apidoc.json`)) {
    configApidoc = JSON.parse(fs.readFileSync(`${process.cwd()}/apidoc.json`, 'utf8'))
  }

  let configPackage = {};

  if (fs.existsSync(`${dir}/package.json`)) {
    configPackage = JSON.parse(fs.readFileSync(`${dir}/package.json`, 'utf8')) || {};
  } else if (fs.existsSync(`${process.cwd()}/package.json`)) {
    configPackage = JSON.parse(fs.readFileSync(`${process.cwd()}/package.json`, 'utf8')) || {};
  }

  if (! configPackage.apidoc) {
    configPackage.apidoc = {};
  }

  return {
    description: configApidoc.description || configPackage.apidoc.description || configPackage.description,
    name: configApidoc.name || configPackage.apidoc.name || configPackage.name,
    sampleUrl: configApidoc.sampleUrl || configPackage.apidoc.sampleUrl,
    title: configApidoc.title || configPackage.apidoc.title || configPackage.name,
    version: configApidoc.version || configPackage.apidoc.version || configPackage.version,
    url: configApidoc.url || configPackage.apidoc.url,
  };
}

function loadGitIgnore(dir) {
  if (fs.existsSync(`${dir}/.gitignore`)) {
    return fs.readFileSync(`${dir}/.gitignore`, {encoding: 'utf8'}).split('\n');
  }
}

function loadTemplate(path, hbs) {
  if (path[0] === '@') { // embedded templates (./src/templates)
    path = `${__dirname}/src/templates/${path.substr(1)}`;
  }

  const assetsDir = fs.readdirSync(`${path}/assets/`);

  assetsDir.forEach((dirEntry) => {
    const fsStat = fs.statSync(`${path}/assets/${dirEntry}`);

    if (fsStat.isFile()) {
      hbs.registerPartial(dirEntry, fs.readFileSync(`${path}/assets/${dirEntry}`, {encoding: 'utf8'}));
    }
  });

  for (const helpersDir of [`${path}/helpers`, './src/helpers']) {
    if (fs.existsSync(`${helpersDir}/index.js`)) {
      for (const [key, val] of Object.entries(require(`${helpersDir}/index.js`))) {
        hbs.registerHelper(key, val);
      }
    }
  }

  return {
    config: JSON.parse(fs.readFileSync(`${path}/config.json`, { encoding: 'utf8' })),
    template: fs.readFileSync(`${path}/template.hbs`, { encoding: 'utf8' }),
  };
}

const config = loadConfig(args.i || args.input);
const hbs = require('handlebars');
const template = loadTemplate(args.t || args.template || '@html', hbs);

const content = generate.generate(
  parse.parseDir(args.i || args.input, [], loadGitIgnore(args.i || args.input)),
  template.template,
  {
    description: args.description || config.description,
    private: typeof argsPrivate === 'string' ? argsPrivate.split(',') : argsPrivate,
    sampleUrl: args.s || args.sampleUrl || config.sampleUrl,
    title: args.title || config.title,
    transports: {
      http: {
        sampleRequestUrl: null,
      },
      https: {
        sampleRequestUrl: null,
      }
    }
  },
  hbs,
);

const outputDir = args.o || args.output || args.i || args.input;

fs.writeFileSync(`${outputDir}/apidoc.${template.config.extension || 'txt'}`, content);

if (args['with-proxy']) {
  for (const file of ['apidog_proxy.js', 'apidog_proxy_config.js', 'package.json']) {
    if (! fs.existsSync(`${outputDir}/${file}`)) {
      fs.copyFileSync(`${__dirname}/src/templates/${file}`, `${outputDir}/${file}`);
    }
  }
}
