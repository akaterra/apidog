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

  function request(
    transport,
    url,
    method,
    data,
    headers,
    contentType,
    config
  ) {
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
        return wsConnect(url, {
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

      default:
        throw new Error(`Unknown transport "${transport}"`);
    }
  }

  function requestWithFormattedBody(
    transport,
    url,
    method,
    bodyParams,
    headers,
    contentType,
    config
  ) {
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

    let data;

    // prepare body based on content type in case of not http GET method
    if (method !== 'GET') {
      if (bodyParams) {
        switch (contentType) {
          case 'form':
            data = compileBodyForm(bodyParams);
            headers['Content-Type'] = 'application/x-www-form-urlencoded';

            break;

          case 'json':
            data = JSON.stringify(bodyParams);
            headers['Content-Type'] = 'application/json';

            break;

          case 'xml':
            data = compileBodyXml(bodyParams, {root: config.options.sampleRequestXmlRoot});
            headers['Content-Type'] = 'text/xml';

            break;
        }
      }
    }

    // insert placeholders
    url = url.replace(/:\w+/g, (key) => {
      if (has(bodyParams, key.substr(1))) {
        const value = get(bodyParams, key.substr(1));

        del(bodyParams, key.substr(1));

        return encodeURIComponent(value);
      } else {
        return key;
      }
    });

    // insert rest of data as query parameters in case of http GET method
    if (method === 'GET') {
      if (bodyParams) {
        if (url.indexOf('?') === -1) {
          url += '?';
        } else if (url.slice(-1) !== '&') {
          url += '&';
        }

        url += compileBodyForm(bodyParams);
      }
    }

    return request(transport, url, method, data, headers, contentType, config);
  }

  request.requestWithFormattedBody = requestWithFormattedBody;

  request.http = {
    delete: (url) => request('http', url, 'delete'),
    get: (url) => request('http', url, 'get'),
    post: (url, bodyParams, contentType) => requestWithFormattedBody('http', url, 'post', bodyParams, undefined, contentType),
    put: (url, bodyParams, contentType) => requestWithFormattedBody('http', url, 'put', bodyParams, undefined, contentType),
    requestWithFormattedBody: (url, method, bodyParams, headers, contentType) => requestWithFormattedBody(
      'http',
      url,
      method,
      bodyParams,
      headers,
      contentType
    ),
  };
  request.ws = {
    disconnect: wsDisconnect,
    connect: wsConnect,
    isConnected: wsIsConnected,
    publish: (url, bodyParams, contentType) => requestWithFormattedBody('ws', url, 'ws', bodyParams, undefined, contentType),
    requestWithFormattedBody: (url, bodyParams, contentType) => requestWithFormattedBody(
      'ws',
      url,
      'ws',
      bodyParams,
      undefined,
      contentType
    ),
  };

  return request;
})();
