const request = (function () {
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

  return function request(transport, url, method, data, headers, contentType, config) {
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

    // insert rest of data as query parameters in case of http "get" method
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

    // prepare body based on content type in case of not http "get" method
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

      default:
        throw new Error(`Unknown transport: ${transport}`);
    }
  };
})();
