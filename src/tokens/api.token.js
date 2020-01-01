/**
 * @api {transport} endpoint [description]
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
          throw new Error(`Unknown "${transportTokens[0]}" transport method "${transportTokens[1]}"`);
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
      throw new Error(`Unknown transport "${transportTokens[0]}"`);
  }

  if (!block.validate) {
    block.validate = [validate];
  } else {
    block.validate.push(validate);
  }

  return block;
}

function validate(block, config) {
  if (block.sampleRequest === undefined) {
    if (config.sampleRequestUrl) {
      block.sampleRequest = [true];
    } else {
      block.sampleRequest = [];
    }
  }

  block.sampleRequest = block.sampleRequest.filter((sampleRequest) => sampleRequest);

  switch (block.api.transport.name) {
    case 'http':
    case 'https':
      if (block.sampleRequest.length) {
        if (!block.sampleRequestProxy) {
          block.sampleRequestProxy = config.sampleRequestProxyHttp || config.sampleRequestProxy;
        }

        block.sampleRequest = block.sampleRequest.map((sampleRequest) => {
          if (sampleRequest === true) {
            const isFullUrl = /^http(s)?:\/\//.test(block.api.endpoint);

            if (isFullUrl || (config && config.sampleRequestUrl)) {
              return isFullUrl ? block.api.endpoint : config.sampleRequestUrl + (
                block.api.endpoint[0] !== '/'
                  ? `/${block.api.endpoint}`
                  : block.api.endpoint
              );
            }
          } else if (sampleRequest !== false) {
            const isFullUrl = /^http(s)?:\/\//.test(sampleRequest);

            if (isFullUrl || (config && config.sampleRequestUrl)) {
              return isFullUrl ? sampleRequest : config.sampleRequestUrl + (
                sampleRequest[0] !== '/'
                  ? `/${sampleRequest}`
                  : sampleRequest
              );
            }
          }

          return false;
        }).filter((sampleRequest) => sampleRequest);
      }

      break;

    case 'nats':
    case 'natsrpc':
      if (block.sampleRequest.length) {
        if (!block.sampleRequestProxy) {
          block.sampleRequestProxy = config.sampleRequestProxyNats || config.sampleRequestProxy;
        }

        if (!block.sampleRequestProxy) {
          block.sampleRequest = [];

          config.logger.warn(`Proxy must be used for ${block.api.transport.name.toUpperCase()} sample requests`);
        } else {
          block.sampleRequest = block.sampleRequest.map((sampleRequest) => {
            return sampleRequest === true
              ? block.api.endpoint
              : sampleRequest;
          });
        }
      }

      break;

    case 'rabbitmq':
    case 'rabbitmqrpc':
      if (block.sampleRequest.length) {
        if (!block.sampleRequestProxy) {
          block.sampleRequestProxy = config.sampleRequestProxyRabbitmq || config.sampleRequestProxy;
        }

        if (!block.sampleRequestProxy) {
          block.sampleRequest = [];

          config.logger.warn(`Proxy must be used for ${block.api.transport.name.toUpperCase()} sample requests`);
        }

        block.sampleRequest = block.sampleRequest.map((sampleRequest) => {
          return sampleRequest === true
            ? block.api.endpoint
            : sampleRequest;
        });
      }

      break;

    case 'websocket':
    case 'ws':
      if (block.sampleRequest.length) {
        if (!block.sampleRequestProxy && (config.sampleRequestProxyWs || config.sampleRequestProxy)) {
          block.sampleRequestProxy = config.sampleRequestProxyWs || config.sampleRequestProxy.replace(/http(s)?:\/\//, 'ws://');
        }

        block.sampleRequest = block.sampleRequest.map((sampleRequest) => {
          if (sampleRequest === true) {
            const isFullUrl = /^ws(s)?:\/\//.test(block.api.endpoint);

            if (isFullUrl || (config && config.sampleRequestUrlWs)) {
              return isFullUrl ? block.api.endpoint : config.sampleRequestUrlWs.replace(/http(s)?:\/\//, 'ws://') + (
                block.api.endpoint[0] !== '/'
                  ? `/${block.api.endpoint}`
                  : block.api.endpoint
              );
            }
          } else if (sampleRequest !== false) {
            const isFullUrl = /^ws(s)?:\/\//.test(sampleRequestWs);

            if (isFullUrl || (config && config.sampleRequestUrl)) {
              return isFullUrl ? sampleRequest : config.sampleRequestUrlWs.replace(/http(s)?:\/\//, 'ws://') + (
                sampleRequest[0] !== '/'
                  ? `/${sampleRequest}`
                  : sampleRequest
              );
            }
          }

          return false;
        }).filter((sampleRequest) => sampleRequest);
      }

      break;

    default:
      throw new Error(`Unknown transport "${block.api.transport.name}"`);
  }

  return block;
}

module.exports = {
  parse,
  validate,
};
