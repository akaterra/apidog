const request = (function () {
  function httpRequest(url, method, data, headers, config) {
    return fetch(url, {
      body: method !== 'GET' ? data : undefined,
      headers,
      method,
    });
  }

  const socketIoConnections = {};

  function socketIoConnect(url, headers, config) {
    const parsedUrl = parseUrl(url);

    if (!(parsedUrl.fullPath in socketIoConnections) || !socketIoIsConnected(url)) {
      socketIoConnections[parsedUrl.fullPath] = io(url, { path: undefined }/*, headers && {transportOptions: {polling: {extraHeaders: headers}}}*/);

      if (config) {
        if (config.onConnect) {
          socketIoConnections[parsedUrl.fullPath].on('connect', () => {
            config.onConnect(socketIoConnections[parsedUrl.fullPath]);

            if (config.onReady) {
              config.onReady(socketIoConnections[parsedUrl.fullPath]);
            }

            if (parsedUrl.queryParams.room) {
              socketIoConnections[parsedUrl.fullPath].emit('join', parsedUrl.queryParams.room);
            }
          });
        }

        if (config.onData) {
          socketIoConnections[parsedUrl.fullPath].on('message', function (msg) {
            config.onData(socketIoConnections[parsedUrl.fullPath], msg);
          });
        }

        if (config.onDisconnect) {
          socketIoConnections[parsedUrl.fullPath].on('disconnect', () => {
            config.onDisconnect(socketIoConnections[parsedUrl.fullPath]);
          });
        }

        if (config.onError) {
          socketIoConnections[parsedUrl.fullPath].on('error', (err) => {
            config.onError(socketIoConnections[parsedUrl.fullPath], `Network error: ${err}`);
          });
        }
      }
    } else {
      if (config) {
        if (config.onReady) {
          config.onReady(socketIoConnections[parsedUrl.fullPath]);
        }
      }
    }

    return socketIoConnections[parsedUrl.fullPath];
  }

  function socketIoDisconnect(url) {
    const parsedUrl = parseUrl(url);

    if (parsedUrl.fullPath in socketIoConnections && socketIoIsConnected(url)) {
      socketIoConnections[parsedUrl.fullPath].close();
    }
  }

  function socketIoIsConnected(url) {
    const parsedUrl = parseUrl(url);

    return parsedUrl.fullPath in socketIoConnections && (
      socketIoConnections[parsedUrl.fullPath].connected
    );
  }

  function socketIoPublish(url, data, headers) {
    const parsedUrl = parseUrl(url);

    if (parsedUrl.fullPath in socketIoConnections && socketIoIsConnected(url)) {
      socketIoConnections[parsedUrl.fullPath].send(data);
    }
  }

  const wsConnections = {};

  function wsConnect(url, config) {
    const parsedUrl = parseUrl(url);

    if (!(parsedUrl.fullPath in wsConnections) || !wsIsConnected(url)) {
      wsConnections[parsedUrl.fullPath] = new WebSocket(url);

      if (config) {
        if (config.onConnect) {
          wsConnections[parsedUrl.fullPath].onopen = () => {
            config.onConnect(wsConnections[parsedUrl.fullPath]);

            if (config.onReady) {
              config.onReady(wsConnections[parsedUrl.fullPath]);
            }
          };
        }

        if (config.onData) {
          wsConnections[parsedUrl.fullPath].onmessage = (msg) => {
            config.onData(wsConnections[parsedUrl.fullPath], msg.data);
          };
        }

        if (config.onDisconnect) {
          wsConnections[parsedUrl.fullPath].onclose = () => {
            config.onDisconnect(wsConnections[parsedUrl.fullPath]);
          };
        }

        if (config.onError) {
          wsConnections[parsedUrl.fullPath].onerror = (err) => {
            config.onError(wsConnections[parsedUrl.fullPath], `Network error`);
          };
        }
      }
    } else {
      if (config) {
        if (config.onReady) {
          config.onReady(wsConnections[parsedUrl.fullPath]);
        }
      }
    }

    return wsConnections[parsedUrl.fullPath];
  }

  function wsDisconnect(url) {
    const parsedUrl = parseUrl(url);

    if (parsedUrl.fullPath in wsConnections && wsIsConnected(url)) {
      wsConnections[parsedUrl.fullPath].close();
    }
  }

  function wsIsConnected(url) {
    const parsedUrl = parseUrl(url);

    return parsedUrl.fullPath in wsConnections && (
      wsConnections[parsedUrl.fullPath].readyState === WebSocket.CONNECTING || wsConnections[parsedUrl.fullPath].readyState === WebSocket.OPEN
    );
  }

  function wsPublish(url, data, headers) {
    const parsedUrl = parseUrl(url);

    if (parsedUrl.fullPath in wsConnections && wsIsConnected(url)) {
      wsConnections[parsedUrl.fullPath].send(data);
    }
  }

  function request(
    transport,
    url,
    method,
    body,
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
        return httpRequest(url, method, body, headers).then((response) => {
          return response.text().then((text) => {
            return {
              response,
              status: response.status,
              text,
            };
          });
        }).catch((error) => {
          if (error instanceof TypeError) {
            throw new Error(`Network error: ${error.message}`);
          }

          if (error.text) {
            return error.text().then((text) => {throw new Error(error.text())});
          }

          throw error;
        });

      case 'socketio':
        return socketIoConnect(url, headers, {
          onConnect: config && config.onConnect,
          onData: config && config.onData,
          onDisconnect: config && config.onDisconnect,
          onError: config && config.onError,
          onReady: (ws) => {
            if (config && config.onReady) {
              config.onReady(ws);
            }

            socketIoPublish(url, body, headers);
          },
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

            wsPublish(url, body, headers);
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
    body,
    type,
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

    switch (type) {
      case 'file':
        data = new FormData();
        Object.entries(body).forEach(([key, val]) => data.append(key, val));
        contentType = undefined;

        break;

      case 'parametrizedbody':
        if (body.parametrizedBody) {
          data = prepareUrl(body.parametrizedBody, body);
        }

        break;

      case 'rawbody':
        if (body.rawBody) {
          data = body.rawBody;
        }

        break;
    }

    // insert placeholders
    url = prepareUrl(url, body);

    // prepare body based on content type in case of not http GET method
    if (method !== 'GET') {
      if (!type || type === 'params') {
        switch (contentType) {
          case 'form':
            data = compileBodyForm(body);
            headers['Content-Type'] = 'application/x-www-form-urlencoded';

            break;

          case 'json':
            data = JSON.stringify(body);
            headers['Content-Type'] = 'application/json';

            break;

          case 'xml':
            data = compileBodyXml(body, {root: config.options.sampleRequestXmlRoot});
            headers['Content-Type'] = 'text/xml';

            break;
        }
      }
    }

    // insert rest of data as query parameters in case of http GET method
    if (method === 'GET') {
      if (body) {
        if (url.indexOf('?') === -1) {
          url += '?';
        } else if (url.slice(-1) !== '&') {
          url += '&';
        }

        url += compileBodyForm(body);
      }
    }

    return request(transport, url, method, data, headers, contentType, config);
  }

  request.requestWithFormattedBody = requestWithFormattedBody;

  request.http = {
    delete: (url) => request('http', url, 'delete'),
    get: (url) => request('http', url, 'get'),
    post: (url, params, contentType) => requestWithFormattedBody('http', url, 'post', params, undefined, undefined, contentType),
    put: (url, params, contentType) => requestWithFormattedBody('http', url, 'put', params, undefined, undefined, contentType),
    requestWithFormattedBody: (url, method, params, headers, contentType) => requestWithFormattedBody(
      'http',
      url,
      method,
      params,
      headers,
      contentType
    ),
  };
  request.socketio = {
    disconnect: socketIoDisconnect,
    connect: socketIoConnect,
    isConnected: socketIoIsConnected,
    publish: (url, params, contentType) => requestWithFormattedBody('socketio', url, 'socketio', params, undefined, contentType),
    requestWithFormattedBody: (url, params, headers, contentType) => requestWithFormattedBody(
      'socketio',
      url,
      'socketio',
      params,
      headers,
      contentType
    ),
  };
  request.ws = {
    disconnect: wsDisconnect,
    connect: wsConnect,
    isConnected: wsIsConnected,
    publish: (url, params, contentType) => requestWithFormattedBody('ws', url, 'ws', params, undefined, contentType),
    requestWithFormattedBody: (url, params, contentType) => requestWithFormattedBody(
      'ws',
      url,
      'ws',
      params,
      undefined,
      contentType
    ),
  };

  return request;
})();
