/**
 * @api {transport} endpoint description
 */

const utils = require('../utils');

const regex = /^\{\s*([\w:]+?)\s*}\s+(\S+)(\s+(.*))?/;

function parse(block, text) {
  const tokens = regex.exec(text);

  if (!tokens) {
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

  switch (transportTokens[0].toLowerCase()) {
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

    case 'natsrpc':
      blockApi.transport = { name: 'natsrpc' };
    
      break;

    case 'rabbitmq':
      blockApi.transport = { name: 'rabbitmq', exchange: transportTokens[1] };

      break;

    case 'rabbitmqrpc':
      blockApi.transport = { name: 'rabbitmqrpc', exchange: transportTokens[1] };

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
  switch (block.api.transport.name) {
    case 'nats':
    case 'rabbitmq':
    case 'rabbitmqrpc':
      if (!block.sampleRequestProxy) {
        block.sampleRequestProxy = config.sampleRequestProxyRabbitmq || config.sampleRequestProxy;
      }

      if (block.sampleRequest) {
        if (config.sampleRequestProxyRabbitmq || config.sampleRequestProxy) {
          block.sampleRequestProxy = config.sampleRequestProxyRabbitmq || config.sampleRequestProxy;
        }

        if (!block.sampleRequestProxy) {
          throw new Error(`Proxy must be used for ${block.api.transport.name.toUpperCase()} sample requests`);
        }

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

    case 'websocket':
    case 'ws':
      if (!block.sampleRequestProxy) {
        block.sampleRequestProxy = config.sampleRequestProxyWs || config.sampleRequestProxy.replace(/http(s)?:\/\//, 'ws://');
      }

      if (block.sampleRequest) {
        if (config.sampleRequestProxyWs || config.sampleRequestProxy) {
          block.sampleRequestProxy = config.sampleRequestProxyWs || config.sampleRequestProxy.replace(/http(s)?:\/\//, 'ws://');
        }

        if (!block.sampleRequestProxy) {
          throw new Error(`Proxy must be used for ${block.api.transport.name.toUpperCase()} sample requests`);
        }

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
      if (!block.sampleRequestProxy) {
        block.sampleRequestProxy = config.sampleRequestProxyHttp || config.sampleRequestProxy;
      }

      if (block.sampleRequest) {
        if (config.sampleRequestProxyHttp || config.sampleRequestProxy) {
          block.sampleRequestProxy = config.sampleRequestProxyHttp || config.sampleRequestProxy;
        }

        block.sampleRequest = block.sampleRequest.map((sampleRequest) => {
          if (typeof sampleRequest === 'string' && sampleRequest[0] !== '/') {
            return sampleRequest;
          }

          if (block.api.endpoint[0] !== '/') {
            return block.api.endpoint;
          }

          if (sampleRequest === true) {
            if (config && config.sampleRequestUrl) {
              return config.sampleRequestUrl + block.api.endpoint;
            }
          } else if (sampleRequest !== false) {
            if (config && config.sampleRequestUrl) {
              return config.sampleRequestUrl + sampleRequest;
            }
          }

          return false;
        });
      }
  }

  return block;
}

module.exports = {
  parse: parse,
};
