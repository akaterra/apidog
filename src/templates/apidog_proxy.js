const fs = require('fs');
const http = require('http');
const https = require('https');
const qs = require('qs');
const URL = require('url').URL;

function createApp(env) {
  const express = require('express');
  const config = env && env.config || require('./apidog_proxy_config.js');
  const app = env.expressConstructor ? env.expressConstructor() : express();

  app.use((req, res, next) => {
    let data = '';

    req.on('data', (chunk) => data += chunk);
    req.on('end', () => {
      req.rawBody = data;

      next();
    });
  });

  app.options('/*', (req, res) => {
    res.header(
      'Access-Control-Allow-Headers',
      config.cors && config.cors.allowHeaders
        ? config.cors.allowHeaders
        : '*'
    );
    res.header(
      'Access-Control-Allow-Methods',
      config.cors && config.cors.allowMethods
        ? config.cors.allowMethods
        : 'DELETE,GET,HEAD,INFO,OPTIONS,PATCH,POST,PUT'
    );
    res.header('Access-Control-Allow-Origin', '*');

    res.status(200).send();
  });

  if (config.allowPresets) {
    app.get('/preset/:presetBlockId', async (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');

      if (config.presetDir) {
        const presetBlockId = encodeURIComponent(req.params.presetBlockId);

        fs.readdir(config.presetDir, async (err, files) => {
          if (err) {
            return res.status(500).json(err.message);
          }

          const presets = {
            [decodeURIComponent(presetBlockId)]: {},
          };

          try {
            for (const file of files) {
              const filenameOnly = file.slice(0, -5);

              if (filenameOnly.substr(0, presetBlockId.length) === presetBlockId) {
                presets[decodeURIComponent(presetBlockId)][decodeURIComponent(filenameOnly.substr(presetBlockId.length + 2))] = await new Promise(
                  (resolve, reject) => fs.readFile(`${config.presetDir}/${file}`, (err, data) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(JSON.parse(data));
                    }
                  })
                );
              }
            }

            res.status(200).json(presets);
          } catch (e) {
            res.status(501).json(err.message);
          }
        });
      } else {
        res.status(501).json('Preset directory is not configured');
      }
    });

    app.put('/preset/:presetBlockId/:presetName', async (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');

      if (config.presetDir) {
        const presetBlockId = encodeURIComponent(req.params.presetBlockId);
        const presetName = encodeURIComponent(req.params.presetName);

        fs.writeFile(`${config.presetDir}/${presetBlockId}__${presetName}.json`, req.rawBody, (err) => {
          if (err) {
            res.status(500).json(err.message);
          } else {
            res.status(204).send();
          }
        });
      } else {
        res.status(501).json('Preset directory is not configured');
      }
    });
  }

  app.all('/:transport/*', async (req, res) => {
    res.header(
      'Access-Control-Allow-Headers',
      config.cors && config.cors.allowHeaders
        ? config.cors.allowHeaders
        : '*'
    );
    res.header(
      'Access-Control-Allow-Methods',
      config.cors && config.cors.allowMethods
        ? config.cors.allowMethods
        : 'DELETE,GET,HEAD,INFO,OPTIONS,PATCH,POST,PUT'
    );
    res.header('Access-Control-Allow-Origin', '*');

    try {
      let response;

      switch (req.params.transport.toLowerCase()) {
        case 'http':
        case 'https':
          delete req.headers.host;

          const url = new URL(req.params['0']);

          const options = {
            port: url.port,
            headers: ['Content-Length', 'Content-Type']
              .concat(config.http && config.http.allowHeaders || [])
              .reduce((acc, key) => {
                if (req.header(key)) {
                  acc[key] = req.header(key);
                }

                return acc;
              }, {}),
            hostname: url.hostname,
            method: req.method,
            path: `${url.pathname}?${qs.stringify(req.query)}`,
            protocol: url.protocol,
            timeout: 60000,
          };

          options.headers.Connection = 'close';

          const protocol = url.protocol === 'https:' ? https : http;

          const proxyReq = protocol.request(options, (proxyRes) => {
            res.status(proxyRes.statusCode);

            for (const [key, val] of Object.entries(proxyRes.headers)) {
              res.setHeader(key, val);
            }

            proxyRes.pipe(res, {end: true});
          });

          proxyReq.on('error', (err) => {
            res.status(503).jsonp({'error': 'Service unavailable'});
          });

          proxyReq.write(req.rawBody);
          proxyReq.end();

          break;

        case 'rabbitmq':
          response = await amqpSend(
            req.params['0'],
            req.rawBody,
            ['Content-Length', 'Content-Type']
              .concat(config.amqp && config.amqp.allowHeaders || [])
              .reduce((acc, key) => {
                acc[key] = req.header(key);

                return acc;
              }, {}),
            req.query
          );

          for (const [key, val] of Object.entries(response.headers)) {
            res.setHeader(key, val);
          }

          res.status(200).send(response.body);

          break;

        case 'rabbitmqrpc':
          response = await amqpRpcSend(
            req.params['0'],
            req.rawBody,
            ['Content-Length', 'Content-Type']
              .concat(config.amqp && config.amqp.allowHeaders || [])
              .reduce((acc, key) => {
                acc[key] = req.header(key);

                return acc;
              }, {}),
            req.query
          );

          for (const [key, val] of Object.entries(response.headers)) {
            res.setHeader(key, val);
          }

          res.status(200).send(response.body);

          break;

        default:
          res.status(400).send('Unknown transport');
      }
    } catch (err) {
      console.error(err);

      res.status(500).json(err.message);
    }
  });

  let amqpConnections = {};
  let amqpChannels = {};

  async function getAmqpConnection(uri) {
    if (uri.substr(0, 7) !== 'amqp://') {
      uri = `amqp://default`;
    }

    uri = new URL(uri);

    if (config.amqp && config.amqp[uri.hostname]) {
      const configEntry = new URL(config.amqp[uri.hostname]);

      uri.hostname = configEntry.hostname;
      uri.pathname = configEntry.pathname;
      uri.port = configEntry.port;
      uri.password = configEntry.password;
      uri.username = configEntry.username;
    }

    uri.pathname = uri.pathname.split('/').slice(1, 2).join('/');

    const key = `${uri.hostname}${uri.port}${uri.username}${uri.password}${uri.pathname}`;

    if (!amqpConnections[key]) {
      amqpConnections[key] = await (env && env.amqplib || require('amqplib')).connect(uri.toString());
    }

    return amqpConnections[key];
  }

  async function getAmqpChannel(uri) {
    if (uri.substr(0, 7) !== 'amqp://') {
      uri = `amqp://default`;
    }

    uri = new URL(uri);

    if (config.amqp && config.amqp[uri.hostname]) {
      const configEntry = new URL(config.amqp[uri.hostname]);

      uri.hostname = configEntry.hostname;
      uri.pathname = configEntry.pathname;
      uri.port = configEntry.port;
      uri.password = configEntry.password;
      uri.username = configEntry.username;
    }

    uri.pathname = uri.pathname.split('/').slice(1, 2).join('/');

    const key = `${uri.hostname}${uri.port}${uri.username}${uri.password}${uri.pathname}`;

    const connection = await getAmqpConnection(uri.toString());

    amqpChannels[key] = await connection.createChannel();

    return amqpChannels[key];
  }

  async function amqpSend(queue, data, headers, opts) {
    const amqpChannel = await getAmqpChannel(queue);
    const amqpQueue = await amqpChannel.assertQueue(queue.substr(queue.lastIndexOf('/') + 1));
    const status = await amqpChannel.sendToQueue(queue.substr(queue.lastIndexOf('/') + 1), Buffer.from(data), {
      headers: headers || {}, ...opts
    });

    return {
      body: `Message has been sent to "${queue}" queue by ApiDog proxy`,
      headers: {},
    };
  }

  async function amqpRpcSend(queue, data, headers, opts) {
    const amqpConnection = await getAmqpConnection(queue);
    const req = (env && env.amqplibRpc || require('amqplib-rpc')).request;
    const res = await req(amqpConnection, queue.substr(queue.lastIndexOf('/') + 1), data, {
      sendOpts: { contentType: headers['Content-Type'], headers: headers || {}, ...opts },
    });

    return {
      body: res.content.toString('utf8'),
      headers: {...res.properties.headers, 'Content-Type': res.properties.contentType || 'text/html'},
    };
  }

  return app;
}

function createAppWebSocket(env) {
  const WebSocket = require('ws');
  const config = env && env.config || require('./apidog_proxy_config.js');

  return {
    listen: (port, fn) => {
      const app = env.webSocketServerConstructor ? (env.webSocketServerConstructor({ port })) : new WebSocket.Server({ port });

      app.on('connection', (ws, req) => {
        let uri = req.url.substr(1);

        if (uri.substr(0, 5) !== 'ws://') {
          uri = `ws://default/${uri}`;
        }

        uri = new URL(uri);

        if (config.webSocket && config.webSocket[uri.hostname]) {
          const configEntry = new URL(config.webSocket[uri.hostname]);

          uri.hostname = configEntry.hostname;
          uri.port = configEntry.port;
        }

        uri = uri.toString();

        const remoteWs = env.webSocketConstructor ? env.webSocketConstructor(uri) : new WebSocket(uri);

        let messageBuffer = [];

        remoteWs.onclose = () => {
          console.info(`Outgoing WebSocket connection closed: ${req.url}`);

          ws.terminate();
        };

        remoteWs.onerror = (err) => {
          console.info(`Outgoing WebSocket connection error: ${req.url}, ${err.message}`);

          ws.terminate();
        };

        remoteWs.onmessage = (message) => {
          console.info(`Outgoing WebSocket connection message: ${req.url}`);

          ws.send(message.data);
        };

        remoteWs.onopen = () => {
          for (const message of messageBuffer) {
            remoteWs.send(message);
          }
        };

        ws.on('disconnect', () => {
          console.info(`Incoming WebSocket connection closed: ${req.url}`);

          remoteWs.terminate();
        });

        ws.on('error', (err) => {
          console.info(`Incoming WebSocket connection error: ${req.url}, ${err.message}`);

          remoteWs.terminate();
        });

        ws.on('message', async (message) => {
          console.info(`Incoming WebSocket connection message: ${req.url}`);

          remoteWs.readyState === WebSocket.OPEN ? remoteWs.send(message) : messageBuffer.push(message);
        });
      });

      if (fn) {
        fn();
      }
    }
  };
}

(async () => {
  if (process.env.NODE_ENV !== 'test') {
    let config = require('./apidog_proxy_config.js');

    if (typeof config === 'function') {
      config = await config();
    }

    if (config.webSocket && config.webSocket.allow) {
      createAppWebSocket({}).listen(
        config.webSocket.proxyPort || 8089,
        () => console.log(`ApiDog WebSocket proxy started on ${config.webSocket.proxyPort || 8089}`)
      );
    }

    if (config.http && config.http.allow) {
      createApp({}).listen(
        config.http.proxyPort || 8088,
        () => console.log(`ApiDog HTTP proxy started on ${config.http.proxyPort || 8088}`)
      );
    }
  }
})();

module.exports = {
  createApp,
  createAppWebSocket,
};
