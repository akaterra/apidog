/**
 * Send sample request
 */
const ssr = (function () {
  function sel() {
    const sel = {
      sel: '',

      checked() {
        sel.sel += ':checked';

        return sel;
      },
      class(CLASS) {
        sel.sel += CLASS === undefined ? '[data-block-ssr-class]' : `[data-block-ssr-class="${CLASS}"]`;

        return sel;
      },
      field(field) {
        sel.sel += field === undefined ? '[data-block-ssr-field]' : `[data-block-ssr-field="${field}"]`;

        return sel;
      },
      group(group) {
        sel.sel += group === undefined ? '[data-block-ssr-group]' : `[data-block-ssr-group="${group}"]`;

        return sel;
      },
      groupSelector(group) {
        sel.sel += group === undefined ? '[data-block-ssr-group-selector]' : `[data-block-ssr-group-selector="${group}"]`;

        return sel;
      },
      gvIndex(index) {
        sel.sel += index === undefined ? '[data-block-ssr-group-variant-index]' : `[data-block-ssr-group-variant-index="${index}"]`;

        return sel;
      },
      gvSelector(selector) {
        sel.sel += selector === undefined ? '[data-block-ssr-group-variant-selector]' : `[data-block-ssr-group-variant-selector="${selector}"]`;

        return sel;
      },
      inputGlobalId(inputGlobalId) {
        sel.sel += inputGlobalId === undefined ? '[data-block-ssr-input-global-id]' : `[data-block-ssr-input-global-id="${inputGlobalId}"]`;

        return sel;
      },
      selectable(selectable) {
        sel.sel += selectable === undefined ? '[data-block-ssr-selectable]' : `[data-block-ssr-selectable="${selectable}"]`;

        return sel;
      },
      not() {
        sel.sel += ':not(';

        return sel;
      },
      ton() {
        sel.sel += ')';

        return sel;
      },
      valueOf() {
        return selector;
      }
    };

    return sel;
  }

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

        case 'socketio':
          return blockDescriptor.sampleRequestProxy
            ? `${blockDescriptor.sampleRequestProxy}/${blockDescriptor.api.transport.name}/${endpoint}`
            : endpoint;
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
        const groups = by.selector(sel().class(CLASS).inputGlobalId().sel, el).reduce((values, subEl) => {
          switch (subEl.dataset.blockSsrParamType) {
            default:
              if (!values[subEl.dataset.blockSsrGroup]) {
                values[subEl.dataset.blockSsrGroup] = { selectedIndex: null, fields: {} };
              }

              const group = values[subEl.dataset.blockSsrGroup].fields;

              if (!group[subEl.dataset.blockSsrField]) {
                group[subEl.dataset.blockSsrField] = { selectedIndex: null, values: {} };
              }

              if (subEl.dataset.blockSsrGroupVariantIndex !== '-1') {
                group[subEl.dataset.blockSsrField].values[subEl.dataset.blockSsrGroupVariantIndex] = getValue(subEl);
              }

              if (group[subEl.dataset.blockSsrField].selectedIndex === null) {
                group[subEl.dataset.blockSsrField].selectedIndex = api.getSelectedInputsGroupVariantIndex(
                  blockId,
                  CLASS,
                  subEl.dataset.blockSsrGroup,
                  subEl.dataset.blockSsrField,
                );
              }
          }

          return values;
        }, {});

        return { selectedIndex: api.getSelectedInputsGroup(blockId, CLASS), groups };
      }

      return { selectedIndex: null, groups: {} };
    },
    getInputsOfSelectedGroup(blockId, CLASS) {
      const el = getBlockEl(blockId);

      if (el) {
        return by.selector(sel().class(CLASS).group(api.getSelectedInputsGroup(blockId, CLASS)).inputGlobalId().sel, el).filter(isVisible).reduce((acc, subEl) => {
          switch (subEl.dataset.blockSsrParamType) {
            default:
              if (subEl.dataset.blockSsrGroupVariantIndex !== '-1') {
                acc[subEl.dataset.blockSsrField] = [getValue(subEl), parseInt(subEl.dataset.blockSsrGroupVariantParamIndex)];
              }
          }

          return acc;
        }, {});
      }
    },
    getSelectedInputsGroup(blockId, CLASS) {
      const el = getBlockEl(blockId);

      if (el) {
        const subEl = by.selector(sel().class(CLASS).groupSelector().checked().sel, el)[0];

        if (subEl) {
          return subEl.dataset.blockSsrGroup;
        }
      }

      return null;
    },
    getSelectedInputsGroupVariantIndex(blockId, CLASS, group, field) {
      const el = getBlockEl(blockId);

      if (el) {
        const subEl = by.selector(sel().class(CLASS).group(group).field(field).gvSelector().checked().sel, el)[0];

        if (subEl) {
          return parseInt(subEl.dataset.blockSsrGroupVariantIndex);
        }
      }

      return 0;
    },
    setInputs(blockId, CLASS, values) {
      const el = getBlockEl(blockId);

      if (el) {
        by.selector(sel().class(CLASS).inputGlobalId().sel, el).forEach((subEl) => {
          switch (subEl.dataset.blockSsrParamType) {
            default:
              if (!values.groups[subEl.dataset.blockSsrGroup]) {
                return;
              }

              const fields = values.groups[subEl.dataset.blockSsrGroup].fields;

              if (!fields[subEl.dataset.blockSsrField]) {
                return;
              }

              if (subEl.dataset.blockSsrGroupVariantIndex !== '-1') {
                setValue(subEl, fields[subEl.dataset.blockSsrField].values[subEl.dataset.blockSsrGroupVariantIndex]);
              }

              if (fields[subEl.dataset.blockSsrField].selectedIndex !== null) {
                api.showInputsGroupVariant(
                  blockId,
                  CLASS,
                  subEl.dataset.blockSsrGroup, subEl.dataset.blockSsrField,
                  fields[subEl.dataset.blockSsrField].selectedIndex,
                );
              }
          }
        });

        api.showInputsGroup(blockId, CLASS, values.selectedIndex);
      }

      return api;
    },
    setSelectedInputsGroup(blockId, CLASS, index) {
      const el = getBlockEl(blockId);

      if (el) {
        const subEl = by.selector(sel().class(CLASS).group(index).groupSelector().sel, el)[0];

        if (subEl) {
          setValue(subEl, true);
        }
      }

      return api;
    },
    setSelectedInputsGroupVariantIndex(blockId, CLASS, group, field, index) {
      const el = getBlockEl(blockId);

      if (el) {
        const subEl = by.selector(sel().class(CLASS).group(group).field(field).gvIndex(index).gvSelector().sel, el)[0];

        if (subEl) {
          setValue(subEl, true);
        }
      }

      return api;
    },
 
    getAuthHeaders(blockId) {
      return api.getInputs(blockId, 'authHeader');
    },
    getAuthHeadersOfSelectedGroup(blockId) {
      return api.getInputsOfSelectedGroup(blockId, 'authHeader');
    },
    setAuthHeaders(blockId, values) {
      return api.setInputs(blockId, 'authHeader', values);
    },

    getAuthQueryParams(blockId) {
      return api.getInputs(blockId, 'authQuery');
    },
    getAuthQueryParamsOfSelectedGroup(blockId) {
      return api.getInputsOfSelectedGroup(blockId, 'authQuery');
    },
    setAuthQueryParams(blockId, values) {
      return api.setInputs(blockId, 'authQuery', values);
    },

    getAuthParams(blockId) {
      return api.getInputs(blockId, 'authParam');
    },
    getAuthParamsOfSelectedGroup(blockId) {
      return api.getInputsOfSelectedGroup(blockId, 'authParam');
    },
    setAuthParams(blockId, values) {
      return api.setInputs(blockId, 'authParam', values);
    },

    getHeaders(blockId) {
      return api.getInputs(blockId, 'header');
    },
    getHeadersOfSelectedGroup(blockId) {
      return api.getInputsOfSelectedGroup(blockId, 'header');
    },
    setHeaders(blockId, values) {
      return api.setInputs(blockId, 'header', values);
    },

    getQueryParams(blockId) {
      return api.getInputs(blockId, 'query');
    },
    getQueryParamsOfSelectedGroup(blockId) {
      return api.getInputsOfSelectedGroup(blockId, 'query');
    },
    setQueryParams(blockId, values) {
      return api.setInputs(blockId, 'query', values);
    },

    getParams(blockId) {
      return api.getInputs(blockId, 'param');
    },
    getParamsOfSelectedGroup(blockId) {
      return api.getInputsOfSelectedGroup(blockId, 'param');
    },
    setParams(blockId, values) {
      return api.setInputs(blockId, 'param', values);
    },

    showInputsGroup(blockId, CLASS, group) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.add(
          by.selector(sel().class(CLASS).not().group(group).ton().selectable('group').sel, el),
          'hidden',
        );
        cls.rem(
          by.selector(sel().class(CLASS).group(group).selectable('group').sel, el),
          'hidden',
        );

        api.setSelectedInputsGroup(blockId, CLASS, group);
      }

      return api;
    },
    showInputsGroupVariant(blockId, CLASS, group, field, index) {
      const el = getBlockEl(blockId);

      if (el) {
        if (group === undefined) {
          group = api.getSelectedInputsGroup(blockId, CLASS);
        }

        cls.add(
          by.selector(sel().class(CLASS).field(field).group(group).not().gvIndex(index).ton().selectable().sel, el),
          'hidden',
        );
        cls.rem(
          by.selector(sel().class(CLASS).field(field).group(group).gvIndex(index).selectable().sel, el),
          'hidden',
        );

        api.setSelectedInputsGroupVariantIndex(blockId, CLASS, group, field, index);
      }

      return api;
    },

    showAuthHeadersGroup(blockId, group) {
      return api.showInputsGroup(blockId, 'authHeader', group);
    },
    showAuthHeadersGroupVariant(blockId, field, index) {
      return api.showInputsGroupVariant(blockId, 'authHeader', undefined, field, index);
    },

    showAuthQueryParamsGroup(blockId, group) {
      return api.showInputsGroup(blockId, 'authQueryParam', group);
    },
    showAuthQueryParamsGroupVariant(blockId, field, index) {
      return api.showInputsGroupVariant(blockId, 'authQueryParam', undefined, field, index);
    },

    showAuthParamsGroup(blockId, group) {
      return api.showInputsGroup(blockId, 'authParam', group);
    },
    showAuthParamsGroupVariant(blockId, field, index) {
      return api.showInputsGroupVariant(blockId, 'authParam', undefined, field, index);
    },

    showHeadersGroup(blockId, group) {
      return api.showInputsGroup(blockId, 'header', group);
    },
    showHeadersGroupVariant(blockId, field, index) {
      return api.showInputsGroupVariant(blockId, 'header', undefined, field, index);
    },

    showQueryParamsGroup(blockId, group) {
      return api.showInputsGroup(blockId, 'queryParam', group);
    },
    showQueryParamsGroupVariant(blockId, field, index) {
      return api.showInputsGroupVariant(blockId, 'queryParam', undefined, field, index);
    },

    showParamsGroup(blockId, group) {
      return api.showInputsGroup(blockId, 'param', group);
    },
    showParamsGroupVariant(blockId, field, index) {
      return api.showInputsGroupVariant(blockId, 'param', undefined, field, index);
    },

    hideResponses(blockId) {
      return api.hideErrorResponse(blockId).hideResponse(blockId);
    },
    hideErrorResponse(blockId) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.add(by.selector('[data-block-ssr-error-response]', el)[0], 'hidden');
        by.selector('[data-block-ssr-error-response] [data-block-ssr-response-body]', el)[0].textContent = '';
        by.selector('[data-block-ssr-error-response] [data-block-ssr-response-status]', el)[0].textContent = '';
      }

      return api;
    },
    hideResponse(blockId) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.add(by.selector('[data-block-ssr-response]', el)[0], 'hidden');
        by.selector('[data-block-ssr-response] [data-block-ssr-response-body]', el)[0].textContent = '';
        by.selector('[data-block-ssr-response] [data-block-ssr-response-status]', el)[0].textContent = '';
      }

      return api;
    },
    showErrorResponse(blockId, text, status, headers) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.rem(by.selector('[data-block-ssr-error-response]', el)[0], 'hidden');
        by.selector('[data-block-ssr-error-response] [data-block-ssr-response-body]', el)[0].textContent = text;
        by.selector('[data-block-ssr-error-response] [data-block-ssr-response-status]', el)[0].textContent = status || '';
      }

      return api.hideResponse(blockId);
    },
    showResponse(blockId, text, status, headers) {
      const el = getBlockEl(blockId);

      if (el) {
        cls.rem(by.selector('[data-block-ssr-response]', el)[0], 'hidden');
        by.selector('[data-block-ssr-response] [data-block-ssr-response-body]', el)[0].textContent = text;
        by.selector('[data-block-ssr-response] [data-block-ssr-response-status]', el)[0].textContent = status || '';
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

    function ssrGroupHandlers(type, showGroupFn, showGroupVariantFn) {
      for (const subEl of by.selector(`[data-block-ssr-class="${type}"][data-block-ssr-group-selector]`, el)) {
        on.click(subEl, () => {
          const viewportY = subEl.offsetTop - window.scrollY;
  
          showGroupFn(blockId, subEl.dataset.blockSsrField);
  
          if (subEl.offsetTop < window.scrollY) {
            window.scrollTo(0, subEl.offsetTop - viewportY);
          }
        });
      }
  
      for (const subEl of by.selector(`[data-block-ssr-class="${type}"][data-block-ssr-group-variant-selector]`, el)) {
        on.click(
          subEl,
          () => {
            showGroupVariantFn(
              blockId,
              subEl.dataset.blockSsrField,
              parseInt(subEl.dataset.blockSsrGroupVariantIndex),
            )
          },
        );
      }
    }

    ssrGroupHandlers('authHeader', api.showAuthHeadersGroup, api.showAuthHeadersGroupVariant);
    ssrGroupHandlers('authQueryParam', api.showAuthHeadersGroup, api.showAuthHeadersGroupVariant);
    ssrGroupHandlers('authParam', api.showAuthHeadersGroup, api.showAuthHeadersGroupVariant);
    ssrGroupHandlers('header', api.showHeadersGroup, api.showHeadersGroupVariant);
    ssrGroupHandlers('queryParam', api.showQueryParamsGroup, api.showQueryParamsGroupVariant);
    ssrGroupHandlers('param', api.showParamsGroup, api.showParamsGroupVariant);

    const blockSsrSendEl = by.selector('[data-block-ssr-send]', el)[0];

    if (blockSsrSendEl) {
      on.click(blockSsrSendEl, () => {
        const contentType = api.getContentType(blockId);
        const headers = { ...api.getHeadersOfSelectedGroup(blockId), ...api.getAuthHeadersOfSelectedGroup(blockId) };
        const queryParams = { ...api.getQueryParamsOfSelectedGroup(blockId), ...api.getAuthQueryParamsOfSelectedGroup(blockId) };
        const params = { ...api.getParamsOfSelectedGroup(blockId), ...api.getAuthParamsOfSelectedGroup(blockId) };

        emitRequestPrepareParams(el, { headers, queryParams, params });

        let {body, type} = prepareBody(params, blockDescriptor.param, api.getSelectedInputsGroup(blockId, 'param'));

        Object.entries(headers).forEach(([key, val]) => {
          headers[key] = val[0];
        }, headers);

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

          case 'socketio':
            actualTransport = 'socketio';
            actualOptions = requestOptions.websocket;

            break;
        }

        const response = request.requestWithFormattedBody(
          actualTransport,
          actualEndpoint,
          blockDescriptor.api.transport.method || 'post',
          queryParams,
          body,
          type,
          headers,
          contentType,
          actualOptions
        );

        if (response instanceof Promise) {
          response.then(({response, status, text}) => {
            emitResponse(el, text, contentType);

            status > 299 ? api.showErrorResponse(blockId, text, status, response.headers) : api.showResponse(blockId, text, status, response.headers);
          }).catch((e) => {
            emitErrorResponse(el, e, contentType);

            api.showErrorResponse(blockId, e.message.text || e.message, 0);
          });
        }
      });
    }

    const blockSsrWsConnectEl = by.selector('[data-block-ssr-ws-connect]', el)[0];

    if (blockSsrWsConnectEl) {
      on.click(blockSsrWsConnectEl, () => {
        const contentType = api.getContentType(blockId);
        const headers = api.getHeadersOfSelectedGroup(blockId);
        const params = api.getParamsOfSelectedGroup(blockId);

        emitRequestPrepareParams(el, {headers, params});

        let {body, type} = prepareBody(params, blockDescriptor.param, api.getSelectedInputsGroup(blockId, 'param'));  

        Object.entries(headers).forEach(([key, val]) => {
          headers[key] = val[0];
        }, headers);

        const actualEndpoint = api.getActualEndpoint(blockId);

        if (actualEndpoint === false) {
          return api.showErrorResponse(blockId, `apiDog proxy must be used for "${blockDescriptor.api.transport.name.toUpperCase()}" requests`);
        }

        switch (blockDescriptor.api.transport.name) {
          case 'socketio':
            request.socketio.connect(prepareUrl(actualEndpoint, params), headers, {
              onConnect: () => api.showWsDisconnect(blockId),
              onData: (ws, data) => api.showResponse(blockId, data),
              onDisconnect: () => api.showWsConnect(blockId),
              onError: (ws, err) => api.showErrorResponse(blockId, err),
            });

            break;

          default:
            request.ws.connect(prepareUrl(actualEndpoint, params), {
              onConnect: () => api.showWsDisconnect(blockId),
              onData: (ws, data) => api.showResponse(blockId, data),
              onDisconnect: () => api.showWsConnect(blockId),
              onError: (ws, err) => api.showErrorResponse(blockId, err),
            });
        }
      });
    }

    const blockSsrWsDisconnectEl = by.selector('[data-block-ssr-ws-disconnect]', el)[0];

    if (blockSsrWsDisconnectEl) {
      on.click(blockSsrWsDisconnectEl, () => {
        const actualEndpoint = api.getActualEndpoint(blockId);

        if (actualEndpoint === false) {
          return api.showErrorResponse(blockId, `apiDog proxy must be used for "${blockDescriptor.api.transport.name.toUpperCase()}" requests`);
        }

        switch (blockDescriptor.api.transport.name) {
          case 'socketio':
            request.socketio.disconnect(actualEndpoint);

            break;

          default:
            request.ws.disconnect(actualEndpoint);
        }

        api.showWsConnect(blockId);
      });
    }
  });

  return api;
})();
