function byId(id) {
  return document.getElementById(id);
}

function bySelector(selector, el) {
  return Array.prototype.slice.call((el || document).querySelectorAll(selector));
}

function addClass(el, cls) {
  const className = el.className.split(' ');
  const index = className.findIndex(function (e) {
    return e === cls;
  });

  if (index !== - 1) {
      return;
  }

  className.push(cls);

  el.className = className.join(' ').trim();
}

function removeClass(el, cls) {
  const className = el.className.split(' ');
  const index = className.findIndex(function (e) {
    return e === cls;
  });

  if (index === - 1) {
      return;
  }

  className.splice(index, 1);

  el.className = className.join(' ').trim();
}

function replaceClass(el, clsOld, clsNew) {
  removeClass(el, clsOld);
  addClass(el, clsNew);
}

function onChange(el, fn) {
  el.onchange = (event) => {
    fn(getValue(event.srcElement), event.srcElement);
  };
}

function onClick(el, fn) {
  el.onclick = (event) => {
    fn(event.srcElement);
  };
}

function selectorReplaceOptions(el, options) {
  const selectedValue = getValue(el);

  el.options.length = 0;

  Object.entries(options).forEach(([key, val]) => {
    const option = document.createElement('option');

    option.value = key;
    option.text = val;

    el.appendChild(option);

    Array.prototype.some.call(el, (option, i) => {
      if (getValue(option) === selectedValue) {
        el.selectedIndex = i;

        return true;
      }

      return false;
    });
  });
}

function selectorAppendOptionUniq(el, value, text) {
  const optionIndex = Array.prototype.findIndex.call(el.options, (option) => getValue(option) === value);

  if (optionIndex === -1) {
    const option = document.createElement('option');

    option.value = value;
    option.text = text;

    el.appendChild(option);

    el.selectedIndex = el.options.length - 1;
  } else {
    el.selectedIndex = optionIndex;
  }
}

function getValue(el) {
  return el.options ? el.options[el.selectedIndex].value : el.value;
}

function setValue(el, value) {
  if (el.options) {

  } else {
    el.value = value;
  }
}

function del(obj, path) {
  for (const key of path.split('.')) {
    if (obj !== null && typeof obj === 'object' && key in obj) {
      delete obj[key];
    } else {
      return false;
    }
  }

  return true;
}

function get(obj, path, defaultValue) {
  for (const key of path.split('.')) {
    if (obj !== null && typeof obj === 'object' && key in obj) {
      obj = obj[key];
    } else {
      return defaultValue;
    }
  }

  return obj;
}

function has(obj, path) {
  for (const key of path.split('.')) {
    if (obj !== null && typeof obj === 'object' && key in obj) {
      obj = obj[key];
    } else {
      return false;
    }
  }

  return true;
}

function hideResponse(el) {
  addClass(bySelector('[data-block-element="response"]', el)[0], 'hidden');
  bySelector('[data-block-element="response"]>pre', el)[0].textContent = '';
}

function showResponse(el, text) {
  removeClass(bySelector('[data-block-element="response"]', el)[0], 'hidden');
  bySelector('[data-block-element="response"]>pre', el)[0].textContent = text;
}

function hideWsConnect(el) {
  addClass(bySelector('[data-block-element="wsConnect"]', el)[0], 'hidden');
  removeClass(bySelector('[data-block-element="wsDisconnect"]', el)[0], 'hidden');
}

function showWsConnect(el) {
  removeClass(bySelector('[data-block-element="wsConnect"]', el)[0], 'hidden');
  addClass(bySelector('[data-block-element="wsDisconnect"]', el)[0], 'hidden');
}

const wsConnections = {};

function wsConnect(url, config) {
  if (! (url in wsConnections) || ! wsIsConnected(url)) {
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

function wsSend(url, data) {
  if (url in wsConnections && wsIsConnected(url)) {
    wsConnections[url].send(data);
  }
}

function request(transport, url, method, data, headers, contentType, config) {
  if (! config) {
    config = {};
  }

  if (! config.options) {
    config.options = {};
  }

  url = url.replace(/:\w+/g, (key) => {
    if (has(data, key.substr(1))) {
      const value = get(data, key.substr(1));

      del(data, key.substr(1));

      return encodeURIComponent(value);
    } else {
      return key;
    }
  });

  if (method === 'get') {
    if (url.indexOf('?') === - 1) {
      url += '?';
    } else if (url.slice(- 1) !== '&') {
      url += '&';
    }

    url += compileBodyForm(data);
  }

  if (! headers) {
    headers = {};
  }

  if (method !== 'get') {
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
        body: method !== 'get' ? data : void 0,
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
}

const lastHintsStatus = {};
const lastSelectedContentType = {};
const lastSelectedVersions = {};
const presets = {};

bySelector('[data-control-panel]').forEach((el) => {
  const family = el.dataset.controlPanel;

  const showHintEl = bySelector('button', el)[0];

  lastHintsStatus[family] = true;

  onClick(showHintEl, () => {
    if (lastHintsStatus[family]) {
      bySelector(`[data-block-hint="${family}"]`).forEach((el) => {
        addClass(el, 'hidden');
      });

      showHintEl.textContent = 'Show hints';
    } else {
      bySelector(`[data-block-hint="${family}"]`).forEach((el) => {
        removeClass(el, 'hidden');
      });

      showHintEl.textContent = 'Hide hints';
    }

    lastHintsStatus[family] = ! lastHintsStatus[family];
  });

  const versionSelectorEl = bySelector('select', el)[0];

  lastSelectedVersions[family] = getValue(versionSelectorEl);

  onChange(versionSelectorEl, (value) => {
    addClass(bySelector(`[data-block="${family}_${lastSelectedVersions[family]}"]`)[0], 'hidden');

    lastSelectedVersions[family] = value;

    removeClass(bySelector(`[data-block="${family}_${lastSelectedVersions[family]}"]`)[0], 'hidden');
  });
});

bySelector('[data-block]').forEach((el) => {
  const blockId = el.dataset.block;

  // sample request

  const blockElementSend = bySelector('[data-block-element="send"]', el)[0];

  if (! blockElementSend) {
    return;
  }

  onClick(blockElementSend, () => {
    const blockDescriptor = sections[el.dataset.block];
    const blockHeaders = {};
    const blockParams = {};
    const contentType = bySelector('[data-block-element="contentType"]', el)[0].value;
    const url = bySelector('[data-block-element="endpoint"]', el)[0].value;

    bySelector('[data-block-element]', el).forEach((blockEl) => {
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

  const blockElementWsConnect = bySelector('[data-block-element="wsConnect"]', el)[0];

  if (blockElementWsConnect) {
    onClick(blockElementWsConnect, () => {
      const url = bySelector('[data-block-element="endpoint"]', el)[0].value;

      wsConnect(url, {
        onConnect: () => hideWsConnect(el),
        onData: (ws, data) => showResponse(el, data),
        onDisconnect: () => showWsConnect(el),
        onError: (ws, err) => showResponse(el, err),
      });
    });
  }

  const blockElementWsDisconnect = bySelector('[data-block-element="wsDisconnect"]', el)[0];

  if (blockElementWsDisconnect) {
    onClick(blockElementWsDisconnect, () => {
      const url = bySelector('[data-block-element="endpoint"]', el)[0].value;

      wsDisconnect(url);
      showWsConnect(el);
    });
  }

  // sample request preset

  const blockElementPresetSelect = bySelector('[data-block-element="presetSelect"]', el)[0];

  if (blockElementPresetSelect) {
    onChange(blockElementPresetSelect, (value) => {
      if (value === 'new') {
        setValue(bySelector('[data-block-element="presetName"]', el)[0], '');

        return;
      }

      setValue(bySelector('[data-block-element="presetName"]', el)[0], value);

      if (blockId in presets && value in presets[blockId]) {
        const preset = presets[blockId][value];

        if (preset.endpoint) {
          setValue(bySelector('[data-block-element="endpoint"]', el)[0], preset.endpoint);
        }

        if (preset.headers) {
          Object.entries(preset.headers).forEach(([key, val]) => {
            const el = bySelector(`#${blockId}_h_${key}`.replace(/\./g, '\\.'))[0];

            if (el) {
              setValue(el, val);
            }
          });
        }

        if (preset.params) {
          Object.entries(preset.params).forEach(([key, val]) => {
            const el = bySelector(`#${blockId}_p_${key}`.replace(/\./g, '\\.'))[0];

            if (el) {
              setValue(el, val);
            }
          });
        }
      }
    });
  }

  const blockElementPresetSave = bySelector('[data-block-element="presetSave"]', el)[0];

  if (blockElementPresetSave) {
    onClick(blockElementPresetSave, () => {
      const presetName = getValue(bySelector('[data-block-element="presetName"]', el)[0]);

      if (!presetName) {
        return;
      }

      const blockHeaders = {};
      const blockParams = {};
      const blockEndpoint = bySelector('[data-block-element="endpoint"]', el)[0].value;

      bySelector('[data-block-element]', el).forEach((blockEl) => {
        switch (blockEl.dataset.blockElement) {
          case 'header':
            blockHeaders[blockEl.name] = getValue(blockEl);

            break;

          case 'param':
            blockParams[blockEl.name] = getValue(blockEl);

            break;
        }
      });

      const blockDescriptor = sections[el.dataset.block];

      request(
        'http',
        `${blockDescriptor.sampleRequestProxy}/preset/${blockId}/${presetName}`,
        'PATCH',
        {
          endpoint: blockEndpoint,
          headers: blockHeaders,
          params: blockParams,
        },
        undefined,
        'json'
      ).then(() => {
        selectorAppendOptionUniq(blockElementPresetSelect, presetName, presetName);
      });
    });
  }

  const blockElementPresetRefreshList = bySelector('[data-block-element="presetRefreshList"]', el)[0];

  if (blockElementPresetRefreshList && blockElementPresetSelect) {
    onClick(blockElementPresetRefreshList, () => {
      const blockDescriptor = sections[el.dataset.block];

      request(
        'http',
        `${blockDescriptor.sampleRequestProxy}/preset/${blockId}`,
        'GET'
      ).then(({text}) => {
        Object.assign(presets, JSON.parse(text));

        selectorReplaceOptions(blockElementPresetSelect, Object.entries(presets[blockId]).reduce((acc, [key, val]) => {
          acc[key] = key;

          return acc;
        }, {'new': 'New'}));
      });
    });
  }
});

bySelector('[data-block-control-panel]').forEach((el) => {
  const id = el.dataset.blockControlPanel;

  const contentTypeSelectorEl = bySelector('select', el)[0];

  lastSelectedContentType[id] = getValue(contentTypeSelectorEl);

  onChange(contentTypeSelectorEl, (value) => {
    for (const el of bySelector(`[data-block-example="${id}_${lastSelectedContentType[id]}"]`)) {
      addClass(el, 'hidden');
    }

    lastSelectedContentType[id] = value;

    for (const el of bySelector(`[data-block-example="${id}_${lastSelectedContentType[id]}"]`)) {
      removeClass(el, 'hidden');
    }
  });
});
