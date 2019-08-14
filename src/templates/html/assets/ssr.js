/**
 * Send sample request
 */
const ssr = (function () {
  by.selector('[data-block]').forEach((el) => {
    const blockSsrSendEl = by.selector('[data-block-ssr-send]', el)[0];

    if (!blockSsrSendEl) {
      return;
    }

    const blockId = el.dataset.block;
    const blockDescriptor = sections[blockId];

    const requestOptions = {
      http: {
        options: blockDescriptor.option,
      },
      websocket: {
        onConnect: () => api.showWsDisconnect(blockId),
        onData: (ws, msg) => api.showResponse(blockId, msg),
        onDisconnect: () => api.showWsConnect(blockId),
        onError: (ws, err) => api.showErrorResponse(blockId, err),
        options: blockDescriptor.option,
      }
    };

    on.click(blockSsrSendEl, () => {
      const config = {};
      const contentType = api.getContentType(blockId);
      const endpoint = api.getEndpoint(blockId);
      const headers = api.getHeaders(blockId);
      const params = api.getParams(blockId);

      emitRequestPrepareParams(el, {headers, params});

      let {data, extra} = prepareBody(params, blockDescriptor.params);

      if (extra) {
        switch (extra.type) {
          case 'file':
            data = extra.value;

            break;

          case 'parametrizedBody':
            data = extra.value;

            break;

          case 'rawBody':
            data = extra.value;

            break;
        }
      }

      if (blockDescriptor.sampleRequestHooks && typeof sampleRequestHooks !== 'undefined') {
        for (const ssrHook of blockDescriptor.sampleRequestHooks) {
          data = sampleRequestHooks[ssrHook](data);
        }
      }

      let actualEndpoint;
      let actualOptions;

      switch (blockDescriptor.api.transport.name) {
        case 'http':
        case 'https':
          api.showResponse(blockId, 'Waiting for response ...');

          if (blockDescriptor.sampleRequestProxy) {
            actualEndpoint = `${blockDescriptor.sampleRequestProxy}/${blockDescriptor.api.transport.name}/${endpoint}`;
          } else {
            actualEndpoint = endpoint;
          }

          actualOptions = requestOptions.http;

          break;

        case 'nats':
        case 'natsrpc':
          api.showResponse(blockId, 'Waiting for response ...');

          if (blockDescriptor.sampleRequestProxy) {
            actualEndpoint = `${blockDescriptor.sampleRequestProxy}/${blockDescriptor.api.transport.name}/${endpoint}`;
          } else {
            return api.showErrorResponse(blockId, 'apiDog proxy must be used for Nats requests');
          }

          actualOptions = requestOptions.http;

          break;

        case 'rabbitmq':
        case 'rabbitmqrpc':
          api.showResponse(blockId, 'Waiting for response ...');

          if (blockDescriptor.sampleRequestProxy) {
            actualEndpoint = `${blockDescriptor.sampleRequestProxy}/${blockDescriptor.api.transport.name}/${endpoint}`;
          } else {
            return api.showErrorResponse(blockId, 'apiDog proxy must be used for RabbitMQ requests');
          }

          actualOptions = requestOptions.http;

          break;

        case 'websocket':
        case 'ws':
          // api.hideResponses(blockId);

          if (blockDescriptor.sampleRequestProxy) {
            actualEndpoint = `${blockDescriptor.sampleRequestProxy.replace(/http(s)?:\/\//, 'ws://')}/${endpoint}`;
          } else {
            actualEndpoint = endpoint;
          }

          actualOptions = requestOptions.websocket;

          break;

        default:
          return api.showErrorResponse(blockId, `Unknown transport "${blockDescriptor.api.transport.name}"`);
      }

      const response = request.requestWithFormattedBody(
        'http',
        `${blockDescriptor.sampleRequestProxy}/${blockDescriptor.api.transport.name}/${endpoint}`,
        blockDescriptor.api.transport.method || 'post',
        data,
        headers,
        contentType,
        actualOptions
      );

      if (response instanceof Promise) {
        response.then(({text}) => {
          emitResponse(el, text, contentType);

          api.showResponse(blockId, text);
        });
      }
    });

    const blockSsrWsConnectEl = by.selector('[data-block-ssr-ws-connect]', el)[0];

    if (blockSsrWsConnectEl) {
      on.click(blockSsrWsConnectEl, () => {
        const endpoint = api.getEndpoint(blockId);

        request.ws.connect(endpoint, {
          onConnect: () => api.showWsDisconnect(blockId),
          onData: (ws, data) => api.showResponse(blockId, data),
          onDisconnect: () => api.showWsConnect(blockId),
          onError: (ws, err) => api.showResponse(blockId, err),
        });
      });
    }

    const blockSsrWsDisconnectEl = by.selector('[data-block-ssr-ws-disconnect]', el)[0];

    if (blockSsrWsDisconnectEl) {
      on.click(blockSsrWsDisconnectEl, () => {
        const endpoint = api.getEndpoint(blockId);

        request.ws.disconnect(endpoint);
        api.showWsConnect(blockId);
      });
    }
  });

  function emitRequestPrepareParams(...args) {
    ee.emit('onSsrRequestPrepareParams', ...args);
  }

  function emitResponse(...args) {
    ee.emit('onSsrResponse', ...args);
  }

  function getBlockEl(blockId) {
    return by.selector(`[data-block="${blockId}"]`)[0];
  }

  function getBlockContentTypeEl(blockId) {
    return by.selector(`[data-block="${blockId}"] [data-block-content-type]`)[0];
  }
  
  function getBlockSsrEndpointEl(blockId) {
    return by.selector(`[data-block="${blockId}"] [data-block-ssr-endpoint]`)[0];
  }

  const api = {
    getContentType(blockId) {
      const el = getBlockContentTypeEl(blockId);

      if (el) {
        return getValue(el);
      }

      return null;
    },
    setContentType(blockId, value) {
      const el = getBlockContentTypeEl(blockId);

      if (el) {
        setValue(el, value);
      }

      return api;
    },

    getEndpoint(blockId) {
      const el = getBlockSsrEndpointEl(blockId);

      if (el) {
        return getValue(el);
      }

      return null;
    },
    setEndpoint(blockId, value) {
      const el = getBlockSsrEndpointEl(blockId);

      if (el) {
        setValue(el, value);
      }

      return api;
    },

    getHeaders(blockId) {
      const el = getBlockEl(blockId);

      if (el) {
        return by.selector('[data-block-ssr-input="header"]', el).reduce((acc, blockSsrInputEl) => {
          acc[blockSsrInputEl.name] = getValue(blockSsrInputEl);

          return acc;
        }, {});
      }

      return {};
    },
    setHeaders(blockId, values) {
      const el = getBlockEl(blockId);

      if (el) {
        by.selector('[data-block-ssr-input="header"]', el).forEach((blockSsrInputEl) => {
          if (blockSsrInputEl.name in values) {
            setValue(blockSsrInputEl, values[blockSsrInputEl.name]);
          }
        });
      }

      return api;
    },

    getParams(blockId) {
      const el = getBlockEl(blockId);

      if (el) {
        return by.selector('[data-block-ssr-input="param"]', el).reduce((acc, blockSsrInputEl) => {
          acc[blockSsrInputEl.name] = getValue(blockSsrInputEl);

          return acc;
        }, {});
      }

      return {};
    },
    setParams(blockId, values) {
      const el = getBlockEl(blockId);

      if (el) {
        by.selector('[data-block-ssr-input="param"]', el).forEach((blockSsrInputEl) => {
          if (blockSsrInputEl.name in values) {
            setValue(blockSsrInputEl, values[blockSsrInputEl.name]);
          }
        });
      }

      return api;
    },

    hideResponses(blockId) {
      return api.hideErrorResponse(blockId).hideResponse(blockId);
    },
    hideErrorResponse(blockId) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.add(by.selector('[data-block-ssr-error-response]', el)[0], 'hidden');
        by.selector('[data-block-ssr-error-response]>pre', el)[0].textContent = '';
      }

      return api;
    },
    hideResponse(blockId) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.add(by.selector('[data-block-ssr-response]', el)[0], 'hidden');
        by.selector('[data-block-ssr-response]>pre', el)[0].textContent = '';
      }

      return api;
    },
    showErrorResponse(blockId, text) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.remove(by.selector('[data-block-ssr-error-response]', el)[0], 'hidden');
        by.selector('[data-block-ssr-error-response]>pre', el)[0].textContent = text;
      }

      return api.hideResponse(blockId);
    },
    showResponse(blockId, text) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.remove(by.selector('[data-block-ssr-response]', el)[0], 'hidden');
        by.selector('[data-block-ssr-response]>pre', el)[0].textContent = text;
      }

      return api.hideErrorResponse(blockId);
    },
    showWsConnect(blockId) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.remove(by.selector('[data-block-ssr-ws-connect]', el)[0], 'hidden');
        cls.add(by.selector('[data-block-ssr-ws-disconnect]', el)[0], 'hidden');
      }
      
      return api;
    },
    showWsDisconnect(blockId) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.add(by.selector('[data-block-ssr-ws-connect]', el)[0], 'hidden');
        cls.remove(by.selector('[data-block-ssr-ws-disconnect]', el)[0], 'hidden');
      }

      return api;
    },
    
    onRequestPrepareParams(cb) {
      ee.on('onSsrRequestPrepareParams', cb);

      return api;
    },
    onResponse(cb) {
      ee.on('onSsrResponse', cb);

      return api;
    },
  };

  return api;
})();
