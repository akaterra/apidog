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

  function getLastSelectedGroup(blockId, cls) {
    if (!lastSelectedGroup[blockId]) {
      lastSelectedGroup[blockId] = {};
    }

    return lastSelectedGroup[blockId][cls] !== undefined ? lastSelectedGroup[blockId][cls] : null;
  }

  function getLastSelectedGroupInputsGroupVariant(blockId, cls) {
    if (!lastSelectedGroup[blockId]) {
      lastSelectedGroup[blockId] = {};
    }

    const alias = `${cls}GroupVariant`;

    if (!lastSelectedGroup[blockId][alias]) {
      lastSelectedGroup[blockId][alias] = {};
    }

    if (!lastSelectedGroup[blockId][alias][lastSelectedGroup[blockId][cls] || null]) {
      lastSelectedGroup[blockId][alias][lastSelectedGroup[blockId][cls] || null] = {};
    }

    return lastSelectedGroup[blockId][alias][lastSelectedGroup[blockId][cls] || null];
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

    getInputs(blockId, CLASS) {
      const el = getBlockEl(blockId);

      if (el) {
        return by.selector(`[data-block-ssr-class="${CLASS}"]`, el).reduce((acc, blockSsrInputEl) => {
          acc[blockSsrInputEl.name] = getValue(blockSsrInputEl);

          return acc;
        }, {});
      }

      return {};
    },
    getInputsByLastGroup(blockId, CLASS) {
      const el = getBlockEl(blockId);

      if (el && api.getDescriptor(blockId)[`${CLASS}GroupVariant`]) {
        const groupInputsGroupVariant = getLastSelectedGroupInputsGroupVariant(blockId, CLASS);
        const groupVariant = api.getDescriptor(blockId)[`${CLASS}GroupVariant`][getLastSelectedGroup(blockId, CLASS)];
        const param = api.getDescriptor(blockId)[CLASS];
        const value = {};

        function map(prop) {
          Object.values(prop).forEach((prop) => {
            prop.some((prop, propIndex) => {
              if (groupInputsGroupVariant[param[prop.list[0]].field.name] === undefined) {
                groupInputsGroupVariant[param[prop.list[0]].field.name] = 0;
              }

              if (param[prop.list[0]] && groupInputsGroupVariant[param[prop.list[0]].field.name] === propIndex) {
                value[param[prop.list[0]].field.name] = [
                  getValue(
                    by.selector(`[data-block-ssr-class="${CLASS}"][data-block-ssr-group-variant-param-index="${prop.list[0]}"]`, el)[0],
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
    setInputs(blockId, cls, values) {
      const el = getBlockEl(blockId);

      if (el) {
        by.selector(`[data-block-ssr-class="${cls}"]`, el).forEach((blockSsrInputEl) => {
          if (blockSsrInputEl.name in values) {
            setValue(blockSsrInputEl, values[blockSsrInputEl.name]);
          }
        });
      }

      return api;
    },
 
    getHeaders(blockId) {
      return api.getInputs(blockId, 'header');
    },
    getHeadersByLastGroup(blockId) {
      return api.getInputsByLastGroup(blockId, 'header');
    },
    setHeaders(blockId, values) {
      return api.setInputs(blockId, 'header', values);
    },

    getParams(blockId) {
      return api.getInputs(blockId, 'param');
    },
    getParamsByLastGroup(blockId) {
      return api.getInputsByLastGroup(blockId, 'param');
    },
    setParams(blockId, values) {
      return api.setInputs(blockId, 'param', values);
    },

    showInputsGroup(blockId, CLASS, group) {
      const el = getBlockEl(blockId);

      if (el) {
        if (!lastSelectedGroup[blockId]) {
          lastSelectedGroup[blockId] = {};
        }
  
        if (group !== lastSelectedGroup[blockId][CLASS]) {
          cls.add(by.selector(`[data-block-ssr-group-selectable="${lastSelectedGroup[blockId][CLASS]}_${CLASS}"]`, el), 'hidden');

          lastSelectedGroup[blockId][CLASS] = group;

          cls.rem(by.selector(`[data-block-ssr-group-selectable="${lastSelectedGroup[blockId][CLASS]}_${CLASS}"]`, el), 'hidden');
        }
      }

      return api;
    },
    showInputsGroupVariant(blockId, CLASS, field, index) {
      const el = getBlockEl(blockId);

      if (el) {
        const groupVariant = getLastSelectedGroupInputsGroupVariant(blockId, CLASS);

        cls.add(
          by.selector(`[data-block-ssr-group-variant-selectable="${field}_${groupVariant[field] || 0}_${CLASS}"]`, el),
          'hidden',
        );

        groupVariant[field] = index;

        cls.rem(
          by.selector(`[data-block-ssr-group-variant-selectable="${field}_${groupVariant[field]}_${CLASS}"]`, el),
          'hidden',
        );
      }

      return api;
    },

    showHeadersGroup(blockId, group) {
      return api.showInputsGroup(blockId, 'header', group);
    },
    showParamsGroupVariant(blockId, field, index) {
      return api.showInputsGroupVariant(blockId, 'header', field, index);
    },

    showParamsGroup(blockId, group) {
      return api.showInputsGroup(blockId, 'param', group);
    },
    showParamsGroupVariant(blockId, field, index) {
      return api.showInputsGroupVariant(blockId, 'param', field, index);
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
        cls.rem(by.selector('[data-block-ssr-error-response]', el)[0], 'hidden');
        by.selector('[data-block-ssr-error-response]>pre', el)[0].textContent = text;
      }

      return api.hideResponse(blockId);
    },
    showResponse(blockId, text) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.rem(by.selector('[data-block-ssr-response]', el)[0], 'hidden');
        by.selector('[data-block-ssr-response]>pre', el)[0].textContent = text;
      }

      return api.hideErrorResponse(blockId);
    },
    showWsConnect(blockId) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.rem(by.selector('[data-block-ssr-ws-connect]', el)[0], 'hidden');
        cls.add(by.selector('[data-block-ssr-ws-disconnect]', el)[0], 'hidden');
      }
      
      return api;
    },
    showWsDisconnect(blockId) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.add(by.selector('[data-block-ssr-ws-connect]', el)[0], 'hidden');
        cls.rem(by.selector('[data-block-ssr-ws-disconnect]', el)[0], 'hidden');
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

    const blockSsrHeadersGroupSelectorCheckedEl = by.selector('[data-block-ssr-class="header"][data-block-ssr-group-selector]:checked', el)[0];

    if (blockSsrHeadersGroupSelectorCheckedEl) {
      lastSelectedGroup[blockId].header = blockSsrHeadersGroupSelectorCheckedEl.dataset.blockSsrGroup;
    }

    for (const subEl of by.selector('[data-block-ssr-class="header"][data-block-ssr-group-selector]', el)) {
      on.click(subEl, () => api.showHeadersGroup(blockId, subEl.dataset.blockSsrField));
    }

    const blockSsrParamsGroupSelectorCheckedEl = by.selector('[data-block-ssr-class="param"][data-block-ssr-group-selector]:checked', el)[0];

    if (blockSsrParamsGroupSelectorCheckedEl) {
      lastSelectedGroup[blockId].param = blockSsrParamsGroupSelectorCheckedEl.dataset.blockSsrGroup;
    }

    for (const subEl of by.selector('[data-block-ssr-class="param"][data-block-ssr-group-selector]', el)) {
      on.click(subEl, () => api.showParamsGroup(blockId, subEl.dataset.blockSsrGroup));
    }

    for (const subEl of by.selector('[data-block-ssr-group-variant-selector]', el)) {
      on.click(
        subEl,
        () => {
          api.showParamsGroupVariant(
            blockId,
            subEl.dataset.blockSsrField,
            parseInt(subEl.dataset.blockSsrGroupVariantIndex),
          )
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
