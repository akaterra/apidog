(function () {
  function hideResponse(el) {
    cls.add(by.selector('[data-block-element="response"]', el)[0], 'hidden');
    by.selector('[data-block-element="response"]>pre', el)[0].textContent = '';
  }

  function showResponse(el, text) {
    cls.remove(by.selector('[data-block-element="response"]', el)[0], 'hidden');
    by.selector('[data-block-element="response"]>pre', el)[0].textContent = text;
  }

  function hideWsConnect(el) {
    cls.add(by.selector('[data-block-element="wsConnect"]', el)[0], 'hidden');
    cls.remove(by.selector('[data-block-element="wsDisconnect"]', el)[0], 'hidden');
  }

  function showWsConnect(el) {
    cls.remove(by.selector('[data-block-element="wsConnect"]', el)[0], 'hidden');
    cls.add(by.selector('[data-block-element="wsDisconnect"]', el)[0], 'hidden');
  }

  const wsConnections = {};

  function wsConnect(url, config) {
    if (!(url in wsConnections) || !wsIsConnected(url)) {
      wsConnections[url] = new WebSocket(url);

      if (config) {
        if (config.onConnect) {
          wsConnections[url].onopen = () => {
            config.onConnect(wsConnections[url]);

            if (config.onReady) {
              config.onReady(wsConnections[url]);
            }
          };
        }

        if (config.onData) {
          wsConnections[url].onmessage = (msg) => {
            config.onData(wsConnections[url], msg.data);
          };
        }

        if (config.onDisconnect) {
          wsConnections[url].onclose = () => {
            config.onDisconnect(wsConnections[url]);
          };
        }

        if (config.onError) {
          wsConnections[url].onerror = (err) => {
            config.onError(wsConnections[url], err);
          };
        }
      }
    } else {
      if (config) {
        if (config.onReady) {
          config.onReady(wsConnections[url]);
        }
      }
    }

    return wsConnections[url];
  }

  function wsDisconnect(url) {
    if (url in wsConnections && wsIsConnected(url)) {
      wsConnections[url].close();
    }
  }

  function wsIsConnected(url) {
    return url in wsConnections && (
      wsConnections[url].readyState === WebSocket.CONNECTING || wsConnections[url].readyState === WebSocket.OPEN
    );
  }

  function wsRequest(url, data) {
    if (url in wsConnections && wsIsConnected(url)) {
      wsConnections[url].send(data);
    }
  }

  window.request = function request(transport, url, method, data, headers, contentType, config) {
    if (!method) {
      method = 'GET';
    } else {
      method = method.toUpperCase();
    }

    if (!headers) {
      headers = {};
    }

    if (!config) {
      config = {};
    }

    if (!config.options) {
      config.options = {};
    }

    // insert placeholders
    url = url.replace(/:\w+/g, (key) => {
      if (has(data, key.substr(1))) {
        const value = get(data, key.substr(1));

        del(data, key.substr(1));

        return encodeURIComponent(value);
      } else {
        return key;
      }
    });

    // insert rest of data as query parameters in case of "get" method
    if (method.toLowerCase() === 'get') {
      if (url.indexOf('?') === - 1) {
        url += '?';
      } else if (url.slice(- 1) !== '&') {
        url += '&';
      }

      if (data) {
        url += compileBodyForm(data);
      }
    }

    // prepare body based on content type in case of not "get" method
    if (method.toLowerCase() !== 'get') {
      if (data) {
        switch (contentType) {
          case 'form':
            data = compileBodyForm(data);
            headers['Content-Type'] = 'application/x-www-form-urlencoded';

            break;

          case 'json':
            data = JSON.stringify(data);
            headers['Content-Type'] = 'application/json';

            break;

          case 'xml':
            data = compileBodyXml(data, {root: config.options.sampleRequestXmlRoot});
            headers['Content-Type'] = 'text/xml';

            break;
        }
      }
    }

    switch (transport) {
      case 'http':
      case 'https':
        return fetch(url, {
          body: method.toLowerCase() !== 'get' ? data : void 0,
          headers,
          method,
        })
          .then((response) => {
            return response.text().then((text) => ({status: response.status, text, response}))
          })
          .catch((error) => {
            if (error instanceof TypeError) {
              return {status: 0, text: 'Network error'};
            }

            if (error.text) {
              return error.text().then((text) => ({status: 0, text: error.text()}));
            }

            return {status: 0, text: error};
          });

      case 'ws':
        wsConnect(url, {
          onConnect: config && config.onConnect,
          onData: config && config.onData,
          onDisconnect: config && config.onDisconnect,
          onError: config && config.onError,
          onReady: (ws) => {
            if (config && config.onReady) {
              config.onReady(ws);
            }

            ws.send(data);
          },
        });

        return wsConnections[url];
    }
  };

  by.selector('[data-block]').forEach((el) => {
    const blockId = el.dataset.block;

    // sample request

    const blockElementSend = by.selector('[data-block-element="send"]', el)[0];

    if (!blockElementSend) {
      return;
    }

    on.click(blockElementSend, () => {
      const blockDescriptor = sections[el.dataset.block];
      const blockHeaders = {};
      const blockParams = {};
      const contentType = by.selector('[data-block-element="contentType"]', el)[0].value;
      const url = by.selector('[data-block-element="endpoint"]', el)[0].value;

      by.selector('[data-block-element]', el).forEach((blockEl) => {
        switch (blockEl.dataset.blockElement) {
          case 'header':
            blockHeaders[blockEl.name] = getValue(blockEl);

            break;

          case 'param':
            blockParams[blockEl.name] = getValue(blockEl);

            break;
        }
      });

      let {data, extra} = prepareBody(blockParams, blockDescriptor.params);

      if (blockDescriptor.sampleRequestHooks && typeof sampleRequestHooks !== 'undefined') {
        for (const sampleRequestHook of blockDescriptor.sampleRequestHooks) {
          data = sampleRequestHooks[sampleRequestHook](data);
        }
      }

      if (blockDescriptor.sampleRequestProxy) {
        switch (blockDescriptor.api.transport.name) {
          case 'amqp':
          case 'amqpRpc':
          case 'http':
          case 'https':
            hideResponse(el);

            request(
              'http',
              `${blockDescriptor.sampleRequestProxy}/${blockDescriptor.api.transport.name}/${url}`,
              blockDescriptor.api.transport.method || 'post',
              data,
              blockHeaders,
              contentType,
              {
                options: blockDescriptor.option
              }
            ).then(({text}) => {
              showResponse(el, text);
            });

            break;

          case 'websocket':
          case 'ws':
            // hideResponse(el);

            request(
              'ws',
              `${blockDescriptor.sampleRequestProxy.replace(/http(s)?:\/\//, 'ws://')}/${url}`,
              'ws',
              data,
              blockHeaders,
              contentType,
              {
                onConnect: () => hideWsConnect(el),
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
          case 'amqp':
          case 'amqpRpc':
            showResponse(el, 'ApiDog proxy must be used for AMQP');

            break;

          case 'http':
          case 'https':
            hideResponse(el);

            request(
              'http',
              url,
              blockDescriptor.api.transport.method || 'get',
              data,
              blockHeaders,
              contentType,
              {
                options: blockDescriptor.option
              }
            ).then(({text}) => {
              showResponse(el, text);
            });

            break;

          case 'websocket':
          case 'ws':
            // hideResponse(el);

            request(
              'ws',
              url,
              'ws',
              data,
              blockHeaders,
              contentType,
              {
                onConnect: () => hideWsConnect(el),
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

    const blockElementWsConnect = by.selector('[data-block-element="wsConnect"]', el)[0];

    if (blockElementWsConnect) {
      on.click(blockElementWsConnect, () => {
        const url = by.selector('[data-block-element="endpoint"]', el)[0].value;

        wsConnect(url, {
          onConnect: () => hideWsConnect(el),
          onData: (ws, data) => showResponse(el, data),
          onDisconnect: () => showWsConnect(el),
          onError: (ws, err) => showResponse(el, err),
        });
      });
    }

    const blockElementWsDisconnect = by.selector('[data-block-element="wsDisconnect"]', el)[0];

    if (blockElementWsDisconnect) {
      on.click(blockElementWsDisconnect, () => {
        const url = by.selector('[data-block-element="endpoint"]', el)[0].value;

        wsDisconnect(url);
        showWsConnect(el);
      });
    }
  });
})();
