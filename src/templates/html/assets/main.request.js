const request = (function () {
  function httpRequest(url, method, data, headers, config) {
    return fetch(url, {
      body: method !== 'GET' ? data : void 0,
      headers,
      method,
    });
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

  function wsPublish(url, data) {
    if (url in wsConnections && wsIsConnected(url)) {
      wsConnections[url].send(data);
    }
  }

  const request = function(transport, url, method, data, headers, contentType, config) {
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

    // insert rest of data as query parameters in case of http GET method
    if (method === 'GET') {
      if (url.indexOf('?') === - 1) {
        url += '?';
      } else if (url.slice(- 1) !== '&') {
        url += '&';
      }

      if (data) {
        url += compileBodyForm(data);
      }
    }

    // prepare body based on content type in case of not http GET method
    if (method !== 'GET') {
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
        return httpRequest(url, method, data, headers).then((response) => {
          return response.text().then((text) => ({status: response.status, text, response}))
        }).catch((error) => {
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

            wsPublish(url, data);
          },
        });

        return Promise.resolve();

      default:
        throw new Error(`Unknown transport: ${transport}`);
    }
  };

  request.http = {
    delete: (url) => request('http', url, 'delete'),
    get: (url) => request('http', url, 'get'),
    post: (url, data, contentType) => request('http', url, 'post', data, undefined, contentType),
    put: (url, data, contentType) => request('http', url, 'put', data, undefined, contentType),
  }
  request.ws = {
    disconnect: wsDisconnect,
    connect: wsConnect,
    isConnected: wsIsConnected,
    publish: (url, data, contentType) => request('ws', url, 'ws', data, undefined, contentType),
  };

  return request;
})();
