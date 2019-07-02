/**
 * @api {transport} endpoint description
 */

const utils = require('../utils');

function addDescription(block, text) {
  return block;
}

const regex = /^\{\s*([\w:]+?)\s*}\s+(\S+)(\s+(.*))?/;

function parse(block, text) {
  const tokens = regex.exec(text);

  if (! tokens) {
    throw new Error('@api malformed');
  }

  if (block.api) {
    throw new Error('@api already defined');
  }

  const blockApi = block.api = {};

  blockApi.endpoint = tokens[2];
  blockApi.title = block.title = tokens[4] || null;

  // transport {name(:...)}
  const transportTokens = utils.strSplitBy(tokens[1], ':');

  switch (transportTokens[0]) {
    case 'http':
    case 'https':
      switch (transportTokens[1]) {
        case 'delete':
        case 'get':
        case 'patch':
        case 'post':
        case 'put':
          blockApi.transport = { name: transportTokens[0], method: transportTokens[1] };

          break;

        default:
          throw new Error('Unknown ' + transportTokens[0] + ' transport method: ' + transportTokens[1]);
      }

      break;

    case 'delete':
    case 'get':
    case 'patch':
    case 'post':
    case 'put':
      blockApi.transport = { name: 'http', method: transportTokens[0] };

      break;

    case 'nats':
      blockApi.transport = { name: 'nats' };

      break;

    case 'rabbitmq':
      blockApi.transport = { name: 'rabbitmq', exchange: transportTokens[1] };

      break;

    case 'rabbitmqRpc':
      blockApi.transport = { name: 'rabbitmqRpc', exchange: transportTokens[1] };

      break;

    case 'test':
      blockApi.transport = { name: 'test' };

      break;

    case 'websocket':
    case 'ws':
      blockApi.transport = { name: 'websocket' };

      break;

    default:
      throw new Error(`Unknown transport ${transportTokens[0]}`);
  }

  block.validate = blockValidate;

  return block;
}

function blockValidate(block, config) {
  if (! block.sampleRequestProxy) {
    block.sampleRequestProxy = config.sampleRequestProxy;
  }

  switch (block.api.transport.name) {
    case 'nats':
    case 'rabbitmq':
    case 'rabbitmqRpc':
      if (! block.sampleRequestProxy) {
        throw new Error(`Proxy must be used for ${block.api.transport.name.toUpperCase()}`);
      }

      if (block.sampleRequest) {
        block.sampleRequest = block.sampleRequest.map((sampleRequest) => {
          if (typeof sampleRequest === 'string') {
            return sampleRequest;
          }

          if (sampleRequest === true) {
            return block.api.endpoint;
          }

          return false;
        });
      }

      break;

    default:
      if (block.sampleRequest) {
        block.sampleRequest = block.sampleRequest.map((sampleRequest) => {
          if (typeof sampleRequest === 'string' && sampleRequest[0] !== '/') {
            return sampleRequest;
          }

          if (block.api.endpoint[0] !== '/') {
            return block.api.endpoint;
          }

          if (sampleRequest === true) {
            if (config && config.sampleUrl) {
              return config.sampleUrl + block.api.endpoint;
            }
          } else if (sampleRequest !== false) {
            if (config && config.sampleUrl) {
              return config.sampleUrl + sampleRequest;
            }
          }

          return false;
        });
      }
  }

  return block;
}

module.exports = {
  addDescription: addDescription,
  parse: parse,
};
