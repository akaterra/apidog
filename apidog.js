#!/usr/bin/env node

'use strict';

const ArgumentParser = require('argparse').ArgumentParser;
const fs = require('fs');
const generate = require('./src/generator');
const parseBlockLines = require('./src/parser.block_lines');
const parseDir = require('./src/parser.dir');
const parseJsonschemaUtils = require('./src/parser.jsonschema.utils');
const parseSwagger = require('./src/parser.swagger');
const parseSwaggerUtils = require('./src/parser.swagger.utils');
const utils = require('./src/utils');

const argumentParser = new ArgumentParser({
  addHelp: true,
  description: 'apiDog - API documentation generator',
  version: JSON.parse(fs.readFileSync(`${__dirname}/package.json`)).version,
});

argumentParser.addArgument(
  [ '--description' ],
  {
    help: 'Custom description that will be used as a description of the generated documentation',
  },
);
argumentParser.addArgument(
  [ '-i', '--input' ],
  {
    action: 'append', help: 'Input source(-s) to be scanned for doc blocks',
  },
);
argumentParser.addArgument(
  [ '--jsonschema' ],
  {
    action: 'append', help: 'JSON Schema source(-s) to be loaded for resolving the external references',
  },
);
argumentParser.addArgument(
  [ '--ordered' ],
  {
    action: 'storeTrue', help: 'Process titles as ordered titles',
  },
);
argumentParser.addArgument(
  [ '-o', '--output' ],
  {
    help: 'Output directory where apidoc.html and additional files will be written',
  },
);
argumentParser.addArgument(
  [ '--parser' ],
  {
    help: 'Parser to be used to parse the doc blocks sources',
  },
);
argumentParser.addArgument(
  [ '-p', '--private' ],
  {
    action: 'append', help: 'Tags to filter doc blocks having all the private tags or entirely marked as private',
  },
);
argumentParser.addArgument(
  [ '-s', '--sampleRequestUrl', '--sampleUrl' ],
  {
    help: 'Base URL that will be used as a prefix for all relative api paths (of HTTP/HTTPS and WebSocket types) in sample requests',
  },
);
argumentParser.addArgument(
  [ '--sampleRequestProxy' ],
  {
    help: 'URL of apiDog proxy to be used to pass requests through it',
  },
);
argumentParser.addArgument(
  [ '--sampleRequestProxy:http' ],
  {
    help: 'URL of apiDog HTTP/HTTPS proxy to be used to pass requests through it',
  },
);
argumentParser.addArgument(
  [ '--sampleRequestProxy:nats' ],
  {
    help: 'URL of apiDog Nats proxy to be used to pass requests through it',
  },
);
argumentParser.addArgument(
  [ '--sampleRequestProxy:rabbitmq' ],
  {
    help: 'URL of apiDog RabbitMQ proxy to be used to pass requests through it',
  },
);
argumentParser.addArgument(
  [ '--sampleRequestProxy:ws', '--sampleRequestProxy:websocket' ],
  {
    help: 'URL of apiDog WebSocket proxy to be used to pass requests through it',
  },
);
argumentParser.addArgument(
  [ '-t', '--template' ],
  {
    help: 'Alias of the built-in template (@html or @md) or the directory where the custom template be load from',
  },
);
argumentParser.addArgument(
  [ '--title' ],
  {
    help: 'Custom title that will be used as a title of the generated documentation',
  },
);
argumentParser.addArgument(
  [ '--withSampleRequestProxy', '--withSrp' ],
  {
    help: 'Create (not rewrites existing) also "apidog_proxy.js", "apidog_proxy.config.js" and "package.json" in the output directory',
  },
);

const args = argumentParser.parseArgs();

let argsInput = (args.i || args.input).length ? (args.i || args.input) : ['.'];
let argsPrivate = args.p || args.private;
let argsParser = args.parser && args.parser.toLowerCase() || 'dir';

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
  const customNameIndex = path.indexOf('.');

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
        hbs.registerPartial(dirEntry + '.content', content.replace(/{{/g, '\\{\\{').replace(/}}/g, '\\}\\}'));
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

const config = loadConfig(argsInput[0]);
const hbs = require('handlebars');
const template = loadTemplate(args.t || args.template || '@html', hbs);
const outputDir = args.o || args.output;

const envConfig = {
  author: config.author,
  description: args.description || config.description,
  keywords: config.keywords,
  i18n: require('./i18n'),
  logger: new utils.Logger(),
  private: argsPrivate,
  ordered: args.ordered,
  outputDir,
  sampleRequestProxy: args.sampleRequestProxy || config.sampleRequestProxy,
  sampleRequestProxyHttp: args['sampleRequestProxy:http'] || config['sampleRequestProxy:http'],
  sampleRequestProxyNats: args['sampleRequestProxy:nats'] || config['sampleRequestProxy:nats'],
  sampleRequestProxyRabbitmq: args['sampleRequestProxy:rabbitmq'] || config['sampleRequestProxy:rabbitmq'],
  sampleRequestProxyWs: args['sampleRequestProxy:ws']
    || args['sampleRequestProxy:websocket']
    || config['sampleRequestProxy:ws']
    || config['sampleRequestProxy:websocket'],
  sampleRequestUrl: args.s || args.sampleRequestUrl || args.sampleUrl || config.sampleRequestUrl || config.sampleUrl,
  schema: {
    jsonschema: (args.jsonschema || []).reduce((acc, source) => {
      const jsonSchemaSpec = parseJsonschemaUtils.fetchSource(source);

      parseJsonschemaUtils.validate(jsonSchemaSpec);

      acc[jsonSchemaSpec.id || jsonSchemaSpec.$id] = jsonSchemaSpec;

      return acc;
    }, {}),
  },
  title: args.title || config.title,
  transports: {
    http: {
      sampleRequestUrl: null,
    },
    https: {
      sampleRequestUrl: null,
    },
  },
  version: config.version,
};

let docBlocks = [];
let linesInlineParser = [];

argsInput.forEach((argInput, index) => {
  let [_, parser, source] = argInput.match(/^(inline:)(.*)$/) || [];

  if (!parser) {
    return;
  }

  switch (parser.slice(0, -1) || argsParser) {
    case 'inline':
      linesInlineParser.push(source);

      argInput[index] = null;

    break;
  }
});

if (linesInlineParser.length) {
  docBlocks = [parseBlockLines.parseBlockLines(linesInlineParser, undefined, envConfig)];
}

argsInput.filter((argInput) => argInput).forEach((argInput, index) => {
  let [_, parser, source] = argInput.match(/^(dir:|inline:|swagger:|)(.*)$/) || [];

  switch (parser.slice(0, -1) || argsParser) {
    case 'dir':
      docBlocks = docBlocks.concat(parseDir.parseDir(source, [], loadGitIgnore(source), envConfig));

      if (index === 0 && !outputDir) {
        envConfig.outputDir = parseDir.normalizeDir(source);
      }

      break;

    case 'swagger':
      docBlocks = docBlocks.concat(parseSwagger.parseSwaggerFile(source, envConfig));

      if (index === 0 && !outputDir) {
        envConfig.outputDir = parseSwagger.normalizeDir(source);
      }

      break;

    default:
      throw new Error(`Unknown doc blocks parser "${argsParser}"`);
  }
});

envConfig.templateProcessor = template.templateProcessor && template.templateProcessor(envConfig);

const content = generate.generate(
  docBlocks,
  template.template,
  envConfig,
  hbs,
);

if (!template.templateProcessor) {
  fs.writeFileSync(`${envConfig.outputDir}/apidoc.${template.config.extension || 'txt'}`, content);
}

if (args.withSampleRequestProxy) {
  for (const file of ['apiDog_proxy.js', 'apiDog_proxy.config.js', 'package.json']) {
    if (!fs.existsSync(`${envConfig.outputDir}/${file}`) || args.withSampleRequestProxy === 'update') {
      fs.copyFileSync(`${__dirname}/src/templates/${file}`, `${envConfig.outputDir}/${file}`);
    }
  }
}
