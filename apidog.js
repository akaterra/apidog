const ArgumentParser = require('argparse').ArgumentParser;
const fs = require('fs');
const generate = require('./src/generator');
const parse = require('./src/parser');

const argumentParser = new ArgumentParser({
  addHelp: true,
  description: 'ApiDog',
  version: JSON.parse(fs.readFileSync(`${__dirname}/package.json`)).version,
});

argumentParser.addArgument(
  [ '--description' ],
  {
    help: 'custom description that will be used as a description of the generated documentation',
  },
);
argumentParser.addArgument(
  [ '-i', '--input' ],
  {
    help: 'input directory to be scanned for blocks',
  },
);
argumentParser.addArgument(
  [ '-o', '--output' ],
  {
    help: 'output directory where apidoc.html and additional files will be saved',
  },
);
argumentParser.addArgument(
  [ '-p', '--private' ],
  {
    help: 'filters blocks having all the private tags or entirely marked as private',
  },
);
argumentParser.addArgument(
  [ '-s', '--sampleRequestUrl', '--sampleUrl' ],
  {
    help: 'base url that will be used as a prefix for all relative api paths in sample requests',
  },
);
argumentParser.addArgument(
  [ '--sampleRequestProxy' ],
  {
    help: 'proxy that will be used for requests',
  },
);
argumentParser.addArgument(
  [ '-t', '--template' ],
  {
    help: 'alias of embedded template (@html or @md) or directory where the custom template be load from',
  },
);
argumentParser.addArgument(
  [ '--title' ],
  {
    help: 'custom title that will be used as a title of the generated documentation',
  },
);
argumentParser.addArgument(
  [ '--withProxy' ],
  {
    help: 'creates (not rewrites existing) also apidog_proxy.js, apidog_proxy_config.js and package.json in the output directory',
  },
);
argumentParser.addArgument(
  [ '--withProxyUpdate' ],
  {
    help: 'updates also apidog_proxy.js, apidog_proxy_config.js and package.json in the output directory',
  },
);

const args = argumentParser.parseArgs();

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
    sampleRequestProxy: args.sampleRequestProxy || config.sampleRequestProxy,
    sampleUrl: args.s || args.sampleRequestUrl || args.sampleUrl || config.sampleRequestUrl || config.sampleUrl,
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

if (args['withProxy'] || args['withProxyUpdate']) {
  for (const file of ['apidog_proxy.js', 'apidog_proxy_config.js', 'package.json']) {
    if (! fs.existsSync(`${outputDir}/${file}`) || args['withProxyUpdate']) {
      fs.copyFileSync(`${__dirname}/src/templates/${file}`, `${outputDir}/${file}`);
    }
  }
}
