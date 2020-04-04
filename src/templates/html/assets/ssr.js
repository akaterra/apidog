/**
 * Send sample request
 */
const ssr = (function () {
  const lastSelectedGroup = {};

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

  function getLastSelectedGroupHeader(blockId) {
    if (!lastSelectedGroup[blockId]) {
      lastSelectedGroup[blockId] = {};
    }

    return lastSelectedGroup[blockId].header !== undefined ? lastSelectedGroup[blockId].header : null;
  }

  function getLastSelectedGroupParam(blockId) {
    if (!lastSelectedGroup[blockId]) {
      lastSelectedGroup[blockId] = {};
    }

    return lastSelectedGroup[blockId].param !== undefined ? lastSelectedGroup[blockId].param : null;
  }

  function getLastSelectedGroupParamGroupVariant(blockId) {
    if (!lastSelectedGroup[blockId]) {
      lastSelectedGroup[blockId] = {};
    }

    if (!lastSelectedGroup[blockId].paramGroupVariant) {
      lastSelectedGroup[blockId].paramGroupVariant = {};
    }

    if (!lastSelectedGroup[blockId].paramGroupVariant[lastSelectedGroup[blockId].param || null]) {
      lastSelectedGroup[blockId].paramGroupVariant[lastSelectedGroup[blockId].param || null] = {};
    }

    return lastSelectedGroup[blockId].paramGroupVariant[lastSelectedGroup[blockId].param || null];
  }

  const api = {
    getActualEndpoint(blockId) {
      const blockDescriptor = api.getDescriptor(blockId);
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

    getDescriptor(blockId) {
      return sections[blockId];
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
        return by.selector(`[data-block-ssr-input="header"][data-block-ssr-group="${lastSelectedGroup[blockId].header}"]`, el).reduce((acc, blockSsrInputEl) => {
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
        const groupParamGroupVariant = getLastSelectedGroupParamGroupVariant(blockId);
        const groupVariant = api.getDescriptor(blockId).paramGroupVariant[getLastSelectedGroupParam(blockId)];
        const param = api.getDescriptor(blockId).param;
        const value = {};

        function map(prop) {
          Object.values(prop).forEach((prop) => {
            prop.some((prop, propIndex) => {
              if (groupParamGroupVariant[param[prop.list[0]].field.name] === undefined) {
                groupParamGroupVariant[param[prop.list[0]].field.name] = 0;
              }

              if (param[prop.list[0]] && groupParamGroupVariant[param[prop.list[0]].field.name] === propIndex) {
                value[param[prop.list[0]].field.name] = [
                  getValue(
                    by.selector(`[data-block-ssr-input="param"][data-block-ssr-input-group-variant-param-index="${prop.list[0]}"]`, el)[0],
                  ),
                  prop.list[0],
                ];
  
                map(prop.prop);
  
                return true;
              }
  
              return false;
            });
          });
        }

        map(groupVariant.prop);

        return value;
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
        if (!lastSelectedGroup[blockId]) {
          lastSelectedGroup[blockId] = {};
        }
  
        if (name !== lastSelectedGroup[blockId].header) {
          cls.add(by.selector(`[data-block-ssr-headers-group="${lastSelectedGroup[blockId].header}"]`, el), 'hidden');

          lastSelectedGroup[blockId].header = name;

          cls.remove(by.selector(`[data-block-ssr-headers-group="${name}"]`, el), 'hidden');
        }
      }

      return api;
    },

    showParamsGroup(blockId, name) {
      const el = getBlockEl(blockId);

      if (el) {
        if (!lastSelectedGroup[blockId]) {
          lastSelectedGroup[blockId] = {};
        }
  
        if (name !== lastSelectedGroup[blockId].param) {
          cls.add(by.selector(`[data-block-ssr-params-group="${lastSelectedGroup[blockId].param}"]`, el), 'hidden');

          lastSelectedGroup[blockId].param = name;

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

  by.selector('[data-block]').forEach((el) => {
    const blockSsrSendEl = by.selector('[data-block-ssr-send]', el)[0];

    if (!blockSsrSendEl) {
      return;
    }

    const blockId = el.dataset.block;
    const blockDescriptor = api.getDescriptor(blockId);

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

    if (!lastSelectedGroup[blockId]) {
      lastSelectedGroup[blockId] = {};
    }

    const blockSsrHeadersGroupSelectorCheckedEl = by.selector('[data-block-ssr-headers-group-selector]:checked', el)[0];

    if (blockSsrHeadersGroupSelectorCheckedEl) {
      lastSelectedGroup[blockId].header = blockSsrHeadersGroupSelectorCheckedEl.dataset.blockSsrRefer;
    }

    for (const subEl of by.selector('[data-block-ssr-headers-group-selector]', el)) {
      on.click(subEl, () => api.showHeadersGroup(blockId, subEl.dataset.blockSsrRefer));
    }

    const blockSsrParamsGroupSelectorCheckedEl = by.selector('[data-block-ssr-params-group-selector]:checked', el)[0];

    if (blockSsrParamsGroupSelectorCheckedEl) {
      lastSelectedGroup[blockId].param = blockSsrParamsGroupSelectorCheckedEl.dataset.blockSsrRefer;
    }

    for (const subEl of by.selector('[data-block-ssr-params-group-selector]', el)) {
      on.click(subEl, () => api.showParamsGroup(blockId, subEl.dataset.blockSsrRefer));
    }

    for (const subEl of by.selector('[data-block-ssr-input-group-variant-section-selector]', el)) {
      on.click(
        subEl,
        () => {
          const groupVariant = getLastSelectedGroupParamGroupVariant(blockId);
          const blockSsrGroupVariantSectionSelector = subEl.dataset.blockSsrInputGroupVariantSectionSelector;
          const blockSsrRefer = subEl.dataset.blockSsrRefer;

          cls.add(
            by.selector(`[data-block-ssr-refer="${blockSsrRefer}"][data-block-ssr-input-group-variant-section="${groupVariant[blockSsrRefer] || 0}"]`, el)[0],
            'hidden',
          );

          groupVariant[subEl.dataset.blockSsrRefer] = blockSsrGroupVariantSectionSelector;

          cls.remove(
            by.selector(`[data-block-ssr-refer="${blockSsrRefer}"][data-block-ssr-input-group-variant-section="${groupVariant[blockSsrRefer]}"]`, el)[0],
            'hidden',
          );
        });
    }

    on.click(blockSsrSendEl, () => {
      const contentType = api.getContentType(blockId);
      const headers = api.getHeadersByLastGroup(blockId);
      const params = api.getParamsByLastGroup(blockId);

      emitRequestPrepareParams(el, {headers, params});

      let {body, type} = prepareBody(params, blockDescriptor.param, lastSelectedGroup[blockId] && lastSelectedGroup[blockId].param || null);

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

  return api;
})();
