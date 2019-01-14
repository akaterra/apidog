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
    fn(getValue(event.srcElement));
  };
}

function onClick(el, fn) {
  el.onclick = (event) => {
    fn(event.srcElement);
  };
}

function getValue(el) {
  return el.options ? el.options[el.selectedIndex].value : el.value;
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
  addClass(
    bySelector('[data-block-element="response"]', el)[0],
    'hidden'
  );
  bySelector('[data-block-element="response"]>pre', el)[0].textContent = '';
}

function showResponse(el, text) {
  removeClass(
    bySelector('[data-block-element="response"]', el)[0],
    'hidden'
  );
  bySelector('[data-block-element="response"]>pre', el)[0].textContent = text;
}

const wsConnections = {};

function request(transport, url, method, params, headers, contentType, config) {
  if (! config) {
    config = {};
  }

  if (! config.options) {
    config.options = {};
  }

  url = url.replace(/:\w+/g, (key) => {
    if (has(params, key.substr(1))) {
      const value = get(params, key.substr(1));

      del(params, key.substr(1));

      return value;
    } else {
      return key;
    }
  });

  if (! headers) {
    headers = {};
  }

  if (params) {
    switch (contentType) {
      case 'form':
        params = Object.keys(params).reduce((acc, key) => {
          if (params[key] !== void 0) {
            acc += encodeURIComponent(key) + '=' + encodeURIComponent(String(params[key])) + '&';
          }

          return acc;
        }, '');
        headers['Content-Type'] = 'application/x-www-form-urlencoded';

        break;

      case 'json':
        params = JSON.stringify(params);
        headers['Content-Type'] = 'application/json';

        break;

      case 'xml':
        function compile(e, k) {
          if (e && typeof e === 'object') {
            const attr = Object.keys(e).reduce((acc, key) => {
              if (! e[key] || typeof e[key] !== 'object') {
                acc.push(`${key}="${e[key]}"`);
              }

              return acc;
            }, []);
            const subs = Object.keys(e).reduce((acc, key) => {
              if (e[key] && typeof e[key] === 'object') {
                acc.push(compile(e[key], key));
              }

              return acc;
            }, []);

            return subs.length
                ? `<${k}${attr.length ? ' ' + attr.join(' ') : ''}>${subs.join()}</${k}>`
                : `<${k}${attr.length ? ' ' + attr.join(' ') : ''} />`;
          } else {
            return `<${k}>${e}</${k}>`;
          }
        }

        if (config.options.sampleRequestXmlRoot) {
          params = {[config.options.sampleRequestXmlRoot]: params};
        }

        params = Object.keys(params).reduce((acc, key) => {
          acc += compile(params[key], key);

          return acc;
        }, '<?xml version="1.0" encoding="UTF-8" ?>');
        headers['Content-Type'] = 'text/xml';
    }
  }

  switch (transport) {
    case 'http':
    case 'https':
      return fetch(url, {
        body: method !== 'get' ? params : void 0,
        headers,
        method,
      })
        .then((response) => response.text().then((text) => ({status: response.status, text, response})))
        .catch((error) => {
          if (error instanceof TypeError) {
            return {status: 0, text: 'ApiDog proxy is not available'};
          }

          if (error.text) {
            return error.text().then((text) => ({status: 0, text: error.text()}));
          }

          return {status: 0, text: error};
        });

    case 'ws':
      if (! (url in wsConnections)) {
        wsConnections[url] = new WebSocket(url);

        wsConnections[url].onmessage = (msg) => {
          if (config.cb) {
            config.cb(null, msg);
          }
        };
      }

      try {
        wsConnections[url].send(params);
      } catch (err) {
        if (config.cb) {
          config.cb(err);
        }
      }

      return wsConnections[url];
  }
}

const lastHintsStatus = {};
const lastSelectedContentType = {};
const lastSelectedVersions = {};

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
  onClick(bySelector('[data-block-element="send"]', el)[0], () => {
    hideResponse(el);

    const blockDescriptor = sections[el.dataset.block];
    const blockHeaders = {};
    const blockParams = {};

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

    let params = prepareBody(blockParams, blockDescriptor.params);

    if (blockDescriptor.sampleRequestHooks && typeof sampleRequestHooks !== 'undefined') {
      for (const sampleRequestHook of blockDescriptor.sampleRequestHooks) {
        params = sampleRequestHooks[sampleRequestHook](params);
      }
    }

    if (blockDescriptor.proxy) {
      request(
        'http',
        `${blockDescriptor.proxy}/${blockDescriptor.api.transport.name}/${bySelector('[data-block-element="endpoint"]', el)[0].value}`,
        blockDescriptor.api.transport.method || 'post',
        params,
        blockHeaders,
        blockDescriptor.contentType[0] || 'form',
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
          request(
            'http',
            bySelector('[data-block-element="endpoint"]', el)[0].value,
            blockDescriptor.api.transport.method || 'get',
            params,
            blockHeaders,
            bySelector('[data-block-element="contentType"]', el)[0].value,
            {
              options: blockDescriptor.option
            }
          ).then(({text}) => {
            showResponse(el, text);
          });

          break;

        case 'websocket':
        case 'ws':
          request(
            'ws',
            bySelector('[data-block-element="endpoint"]', el)[0].value,
            blockDescriptor.api.transport.method || 'get',
            params,
            blockHeaders,
            bySelector('[data-block-element="contentType"]', el)[0].value,
            {
              cb: (err, msg) => showResponse(el, err || msg),
              options: blockDescriptor.option
            }
          );

          break;

        default:
          showResponse(el, `Unknown transport: ${blockDescriptor.api.transport.name}`);
      }
    }
  });
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
