/**
 * Send sample request
 */
const ssr = (function () {
  const lastSelectedGroups = {};

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
        options: blockDescriptor.sampleRequestOption,
      },
    };

    if (!lastSelectedGroups[blockId]) {
      lastSelectedGroups[blockId] = {};
    }

    const blockSsrHeadersGroupSelectorCheckedEl = by.selector('[data-block-ssr-headers-group-selector]:checked', el)[0];

    if (blockSsrHeadersGroupSelectorCheckedEl) {
      lastSelectedGroups[blockId].headers = blockSsrHeadersGroupSelectorCheckedEl.dataset.blockSsrName;
    }

    for (const blockSsrHeadersGroupSelectorEl of by.selector('[data-block-ssr-headers-group-selector]', el)) {
      on.click(blockSsrHeadersGroupSelectorEl, () => api.showHeadersGroup(blockId, blockSsrHeadersGroupSelectorEl.dataset.blockSsrName));
    }

    const blockSsrParamsGroupSelectorCheckedEl = by.selector('[data-block-ssr-params-group-selector]:checked', el)[0];

    if (blockSsrParamsGroupSelectorCheckedEl) {
      lastSelectedGroups[blockId].params = blockSsrParamsGroupSelectorCheckedEl.dataset.blockSsrName;
    }

    for (const blockSsrParamsGroupSelectorEl of by.selector('[data-block-ssr-params-group-selector]', el)) {
      on.click(blockSsrParamsGroupSelectorEl, () => api.showParamsGroup(blockId, blockSsrParamsGroupSelectorEl.dataset.blockSsrName));
    }

    on.click(blockSsrSendEl, () => {
      const contentType = api.getContentType(blockId);
      const headers = api.getHeadersByLastGroup(blockId);
      const params = api.getParamsByLastGroup(blockId);

      emitRequestPrepareParams(el, {headers, params});

      let {body, type} = prepareBody(params, blockDescriptor.params, lastSelectedGroups[blockId] && lastSelectedGroups[blockId].params || null);

      if (blockDescriptor.sampleRequestHooks && typeof sampleRequestHooks !== 'undefined') {
        for (const ssrHook of blockDescriptor.sampleRequestHooks) {
          body = sampleRequestHooks[ssrHook](body);
        }
      }

      const actualEndpoint = api.getActualEndpoint(blockId);

      if (actualEndpoint === false) {
        return api.showErrorResponse(blockId, `apiDog proxy must be used for "${blockDescriptor.api.transport.name.toUpperCase()}" requests`);
      }

      if (actualEndpoint === null) {
        return api.showErrorResponse(blockId, `Unknown transport "${blockDescriptor.api.transport.name.toUpperCase()}"`);
      }

      let actualTransport;
      let actualOptions;

      switch (blockDescriptor.api.transport.name) {
        case 'http':
        case 'https':
        case 'natspub':
        case 'natsrpc':
        case 'rabbitmqpub':
        case 'rabbitmqrpc':
        case 'redispub':
          api.showResponse(blockId, 'Waiting for response ...');

          actualTransport = 'http';
          actualOptions = requestOptions.http;

          break;

        case 'natssub':
        case 'rabbitmqsub':
        case 'redissub':
        case 'websocket':
        case 'websocketsecure':
        case 'ws':
        case 'wss':
          // api.hideResponses(blockId);

          actualTransport = 'ws';
          actualOptions = requestOptions.websocket;

          break;
      }

      const response = request.requestWithFormattedBody(
        actualTransport,
        actualEndpoint,
        blockDescriptor.api.transport.method || 'post',
        body,
        type,
        headers,
        contentType,
        actualOptions
      );

      if (response instanceof Promise) {
        response.then(({status, text}) => {
          emitResponse(el, text, contentType);

          status > 299 ? api.showErrorResponse(blockId, text) : api.showResponse(blockId, text);
        }).catch((e) => {
          emitErrorResponse(el, e, contentType);

          api.showErrorResponse(blockId, e.message.text || e.message);
        });
      }
    });

    const blockSsrWsConnectEl = by.selector('[data-block-ssr-ws-connect]', el)[0];

    if (blockSsrWsConnectEl) {
      on.click(blockSsrWsConnectEl, () => {
        const contentType = api.getContentType(blockId);
        const headers = api.getHeaders(blockId);
        const params = api.getParams(blockId);
  
        emitRequestPrepareParams(el, {headers, params});

        const actualEndpoint = api.getActualEndpoint(blockId);

        if (actualEndpoint === false) {
          return api.showErrorResponse(blockId, `apiDog proxy must be used for "${blockDescriptor.api.transport.name.toUpperCase()}" requests`);
        }

        request.ws.connect(prepareUrl(actualEndpoint, params), {
          onConnect: () => api.showWsDisconnect(blockId),
          onData: (ws, data) => api.showResponse(blockId, data),
          onDisconnect: () => api.showWsConnect(blockId),
          onError: (ws, err) => api.showErrorResponse(blockId, err),
        });
      });
    }

    const blockSsrWsDisconnectEl = by.selector('[data-block-ssr-ws-disconnect]', el)[0];

    if (blockSsrWsDisconnectEl) {
      on.click(blockSsrWsDisconnectEl, () => {
        const actualEndpoint = api.getActualEndpoint(blockId);

        if (actualEndpoint === false) {
          return api.showErrorResponse(blockId, `apiDog proxy must be used for "${blockDescriptor.api.transport.name.toUpperCase()}" requests`);
        }

        request.ws.disconnect(actualEndpoint);
        api.showWsConnect(blockId);
      });
    }
  });

  function emitRequestPrepareParams(...args) {
    ee.emit('onSsrRequestPrepareParams', ...args);
  }

  function emitErrorResponse(...args) {
    ee.emit('onSsrErrorResponse', ...args);
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
    getActualEndpoint(blockId) {
      const blockDescriptor = sections[blockId];
      const endpoint = api.getEndpoint(blockId);

      switch (blockDescriptor.api.transport.name) {
        case 'http':
        case 'https':
        case 'natspub':
        case 'natsrpc':
        case 'rabbitmqpub':
        case 'rabbitmqrpc':
        case 'redispub':
          return blockDescriptor.sampleRequestProxy
            ? `${blockDescriptor.sampleRequestProxy}/${blockDescriptor.api.transport.name}/${endpoint}`
            : endpoint;

        case 'natssub':
        case 'rabbitmqsub':
        case 'redissub':
        case 'websocket':
        case 'websocketsecure':
        case 'ws':
        case 'wss':
          return blockDescriptor.sampleRequestProxy
            ? `${blockDescriptor.sampleRequestProxy.replace(/http(s)?:\/\//, 'ws://')}/${blockDescriptor.api.transport.name}/${endpoint}`
            : endpoint;

          break;
      }

      return null;
    },

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
    getHeadersByLastGroup(blockId) {
      const el = getBlockEl(blockId);

      if (el) {
        return by.selector(`[data-block-ssr-input="header"][data-block-ssr-group="${lastSelectedGroups[blockId].headers}"]`, el).reduce((acc, blockSsrInputEl) => {
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
    getParamsByLastGroup(blockId) {
      const el = getBlockEl(blockId);

      if (el) {
        return by.selector(`[data-block-ssr-input="param"][data-block-ssr-group="${lastSelectedGroups[blockId].params}"]`, el).reduce((acc, blockSsrInputEl) => {
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

    showHeadersGroup(blockId, name) {
      const el = getBlockEl(blockId);

      if (el) {
        if (!lastSelectedGroups[blockId]) {
          lastSelectedGroups[blockId] = {};
        }
  
        if (name !== lastSelectedGroups[blockId].headers) {
          cls.add(by.selector(`[data-block-ssr-headers-group="${lastSelectedGroups[blockId].headers}"]`, el), 'hidden');

          lastSelectedGroups[blockId].headers = name;

          cls.remove(by.selector(`[data-block-ssr-headers-group="${name}"]`, el), 'hidden');
        }
      }

      return api;
    },

    showParamsGroup(blockId, name) {
      const el = getBlockEl(blockId);

      if (el) {
        if (!lastSelectedGroups[blockId]) {
          lastSelectedGroups[blockId] = {};
        }
  
        if (name !== lastSelectedGroups[blockId].params) {
          cls.add(by.selector(`[data-block-ssr-params-group="${lastSelectedGroups[blockId].params}"]`, el), 'hidden');

          lastSelectedGroups[blockId].params = name;

          cls.remove(by.selector(`[data-block-ssr-params-group="${name}"]`, el), 'hidden');
        }
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
