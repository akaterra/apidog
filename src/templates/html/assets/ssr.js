/**
 * Send sample request
 */
const ssr = (function () {
  function hideResponse(el) {
    cls.add(by.selector('[data-block-ssr-response]', el)[0], 'hidden');
    by.selector('[data-block-ssr-response]>pre', el)[0].textContent = '';
  }

  function showResponse(el, text) {
    cls.remove(by.selector('[data-block-ssr-response]', el)[0], 'hidden');
    by.selector('[data-block-ssr-response]>pre', el)[0].textContent = text;
  }

  function showWsConnect(el) {
    cls.remove(by.selector('[data-block-ssr-ws-connect]', el)[0], 'hidden');
    cls.add(by.selector('[data-block-ssr-ws-disconnect]', el)[0], 'hidden');
  }

  function showWsDisconnect(el) {
    cls.add(by.selector('[data-block-ssr-ws-connect]', el)[0], 'hidden');
    cls.remove(by.selector('[data-block-ssr-ws-disconnect]', el)[0], 'hidden');
  }

  by.selector('[data-block]').forEach((el) => {
    const blockId = el.dataset.block;

    const blockSsrSend = by.selector('[data-block-ssr-send]', el)[0];

    if (!blockSsrSend) {
      return;
    }

    on.click(blockSsrSend, () => {
      const blockDescriptor = sections[el.dataset.block];
      const contentType = by.selector('[data-block-content-type]', el)[0].value;
      const endpoint = by.selector('[data-block-ssr-endpoint]', el)[0].value;
      const headers = {};
      const params = {};

      by.selector('[data-block-ssr-input]', el).forEach((blockSsrInputEl) => {
        switch (blockSsrInputEl.dataset.blockSsrInput) {
          case 'header':
            headers[blockSsrInputEl.name] = getValue(blockSsrInputEl);

            break;

          case 'param':
            params[blockSsrInputEl.name] = getValue(blockSsrInputEl);

            break;
        }
      });

      emitRequestPrepareParams(el, {headers, params});

      let {data, extra} = prepareBody(params, blockDescriptor.params);

      if (blockDescriptor.sampleRequestHooks && typeof sampleRequestHooks !== 'undefined') {
        for (const ssrHook of blockDescriptor.sampleRequestHooks) {
          data = sampleRequestHooks[ssrHook](data);
        }
      }

      if (blockDescriptor.sampleRequestProxy) {
        switch (blockDescriptor.api.transport.name) {
          case 'http':
          case 'https':
          case 'rabbitmq':
          case 'rabbitmqrpc':
            hideResponse(el);

            request(
              'http',
              `${blockDescriptor.sampleRequestProxy}/${blockDescriptor.api.transport.name}/${endpoint}`,
              blockDescriptor.api.transport.method || 'post',
              data,
              headers,
              contentType,
              {
                options: blockDescriptor.option
              }
            ).then(({text}) => {
              emitResponse(el, text, contentType);

              showResponse(el, text);
            });

            break;

          case 'websocket':
          case 'ws':
            // hideResponse(el);

            request(
              'ws',
              `${blockDescriptor.sampleRequestProxy.replace(/http(s)?:\/\//, 'ws://')}/${endpoint}`,
              'ws',
              data,
              headers,
              contentType,
              {
                onConnect: () => showWsDisconnect(el),
                onData: (ws, msg) => showResponse(el, msg),
                onDisconnect: () => showWsConnect(el),
                onError: (ws, err) => showResponse(el, err),
                options: blockDescriptor.option
              }
            );

            break;

          default:
            showResponse(el, `Unknown transport: ${blockDescriptor.api.transport.name}`);
        }
      } else {
        switch (blockDescriptor.api.transport.name) {
          case 'http':
          case 'https':
            hideResponse(el);

            request(
              'http',
              endpoint,
              blockDescriptor.api.transport.method || 'get',
              data,
              headers,
              contentType,
              {
                options: blockDescriptor.option
              }
            ).then(({text}) => {
              emitResponse(el, text, contentType);

              showResponse(el, text);
            });

            break;

          case 'rabbitmq':
          case 'rabbitmqrpc':
            showResponse(el, 'ApiDog proxy must be used for RabbitMQ requests');

            break;

          case 'websocket':
          case 'ws':
            // hideResponse(el);

            request(
              'ws',
              endpoint,
              'ws',
              data,
              headers,
              contentType,
              {
                onConnect: () => showWsDisconnect(el),
                onData: (ws, msg) => showResponse(el, msg),
                onDisconnect: () => showWsConnect(el),
                onError: (ws, err) => showResponse(el, err),
                options: blockDescriptor.option
              }
            );

            break;

          default:
            showResponse(el, `Unknown transport: ${blockDescriptor.api.transport.name}`);
        }
      }
    });

    const blockSsrWsConnect = by.selector('[data-block-ssr-ws-connect]', el)[0];

    if (blockSsrWsConnect) {
      on.click(blockSsrWsConnect, () => {
        const endpoint = by.selector('[data-block-ssr-endpoint]', el)[0].value;

        request.ws.connect(endpoint, {
          onConnect: () => showWsDisconnect(el),
          onData: (ws, data) => showResponse(el, data),
          onDisconnect: () => showWsConnect(el),
          onError: (ws, err) => showResponse(el, err),
        });
      });
    }

    const blockSsrWsDisconnect = by.selector('[data-block-ssr-ws-disconnect]', el)[0];

    if (blockSsrWsDisconnect) {
      on.click(blockSsrWsDisconnect, () => {
        const endpoint = by.selector('[data-block-ssr-endpoint]', el)[0].value;

        request.ws.disconnect(endpoint);
        showWsConnect(el);
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

  function getBlockSsrEndpointEl(blockId) {
    return by.selector(`[data-block="${blockId}"] [data-block-ssr-endpoint]`)[0];
  }

  const api = {
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
