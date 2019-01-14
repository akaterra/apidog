const fs = require('fs');
const generate = require('./src/generate');
const parse = require('./src/parse');

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

const html = generate.generateByTemplateFile(
  parse.parseDir(args.i || args.input),
  args.t || args.template || '@html',
  {
    description: args.description,
    private: typeof argsPrivate === 'string' ? argsPrivate.split(',') : argsPrivate,
    sampleUrl: args.s || args.sampleUrl,
    title: args.title,
    transports: {
      http: {
        sampleRequestUrl: null,
      },
      https: {
        sampleRequestUrl: null,
      }
    }
  }
);

fs.writeFileSync(args.o || args.output || 'apidog', html);
