const ArgumentParser = require('argparse').ArgumentParser;
const fs = require('fs');
const generate = require('./src/generator');
const parse = require('./src/parser');

const argumentParser = new ArgumentParser({
  addHelp: true,
  description: 'ApiDog - API documentation generator',
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
    help: 'url of ApiDog proxy to be used for requests',
  },
);
argumentParser.addArgument(
  [ '--sampleRequestProxy:http' ],
  {
    help: 'url of ApiDog HTTP proxy to be used for requests',
  },
);
argumentParser.addArgument(
  [ '--sampleRequestProxy:rabbitmq' ],
  {
    help: 'url of ApiDog RabbitMQ proxy to be used for requests',
  },
);
argumentParser.addArgument(
  [ '--sampleRequestProxy:ws' ],
  {
    help: 'url of ApiDog WebSocket proxy to be used for requests',
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
  [ '-srp', '--withSampleRequestProxy' ],
  {
    help: 'creates (not rewrites existing) also apidog_proxy.js, apidog_proxy_config.js and package.json in the output directory',
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

  if (!configPackage.apidoc) {
    configPackage.apidoc = {};
  }

  return {
    author: configApidoc.author || configPackage.apidoc.author || configPackage.author,
    description: configApidoc.description || configPackage.apidoc.description || configPackage.description,
    keywords: configApidoc.keywords || configPackage.apidoc.keywords || configPackage.keywords,
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
  const customNameIndex = path.lastIndexOf('.');

  let [realPath, customName] = customNameIndex !== - 1
    ? [path.substr(0, customNameIndex), path.substr(customNameIndex)]
    : [path, ''];

  if (realPath[0] === '@') { // embedded templates (./src/templates)
    realPath = `${__dirname}/src/templates/${realPath.substr(1)}`;
  }

  for (const dirName of [`${realPath}/assets`, './src/helpers', `${realPath}/helpers`]) {
    const dir = fs.readdirSync(dirName);

    dir.forEach((dirEntry) => {
      const fsStat = fs.statSync(`${dirName}/${dirEntry}`);

      if (fsStat.isFile() && dirEntry !== 'index.js') {
        let content = fs.readFileSync(`${dirName}/${dirEntry}`, {encoding: 'utf8'});

        if (content.substr(0, 4) === 'ref:') {
          content = fs.readFileSync(content.substr(4), {encoding: 'utf8'});
        }

        hbs.registerPartial(dirEntry, content);
      }
    });
  }

  for (const helpersDir of [`${realPath}/helpers`, './src/helpers']) {
    if (fs.existsSync(`${helpersDir}/index.js`)) {
      for (const [key, val] of Object.entries(require(`${helpersDir}/index.js`))) {
        hbs.registerHelper(key, val);
      }
    }
  }

  const templateProcessor = fs.existsSync(`${realPath}/template${customName}.js`)
    ? require(`${realPath}/template${customName}.js`)
    : null;

  return {
    config: JSON.parse(fs.readFileSync(`${realPath}/config.json`, { encoding: 'utf8' })),
    template: fs.readFileSync(`${realPath}/template${customName}.hbs`, { encoding: 'utf8' }),
    templateProcessor,
  };
}

const config = loadConfig(args.i || args.input);
const hbs = require('handlebars');
const template = loadTemplate(args.t || args.template || '@html', hbs);
const outputDir = args.o || args.output || args.i || args.input;
const content = generate.generate(
  parse.parseDir(args.i || args.input, [], loadGitIgnore(args.i || args.input)),
  template.template,
  {
    author: config.author,
    description: args.description || config.description,
    keywords: config.keywords,
    private: typeof argsPrivate === 'string' ? argsPrivate.split(',') : argsPrivate,
    sampleRequestProxy: args.sampleRequestProxy || config.sampleRequestProxy,
    sampleRequestProxyHttp: args['sampleRequestProxy:http'] || config['sampleRequestProxy:http'],
    sampleRequestProxyRabbitmq: args['sampleRequestProxy:rabbitmq'] || config['sampleRequestProxy:rabbitmq'],
    sampleRequestProxyWs: args['sampleRequestProxy:ws'] || config['sampleRequestProxy:ws'],
    sampleRequestUrl: args.s || args.sampleRequestUrl || args.sampleUrl || config.sampleRequestUrl || config.sampleUrl,
    title: args.title || config.title,
    transports: {
      http: {
        sampleRequestUrl: null,
      },
      https: {
        sampleRequestUrl: null,
      }
    },
    version: config.version,
  },
  template.templateProcessor && template.templateProcessor(outputDir),
  hbs,
);

if (!template.templateProcessor) {
  fs.writeFileSync(`${outputDir}/apidoc.${template.config.extension || 'txt'}`, content);
}

if (args.withSampleRequestProxy) {
  for (const file of ['apidog_proxy.js', 'apidog_proxy_config.js', 'package.json']) {
    if (!fs.existsSync(`${outputDir}/${file}`) || args.withSampleRequestProxy === 'update') {
      fs.copyFileSync(`${__dirname}/src/templates/${file}`, `${outputDir}/${file}`);
    }
  }
}
