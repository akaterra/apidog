const fs = require('fs');
const http = require('http');
const https = require('https');
const qs = require('qs');
const URL = require('url').URL;

/**
 * HTTP
 */

async function createAppHttp(env) {
  const express = require('express');
  const config = await getConfig(env);
  const app = env.expressConstructor ? env.expressConstructor() : express();

  natsFlush();
  rabbitmqFlush();
  redisFlush();

  app.use((req, res, next) => {
    let data = '';

    req.on('data', (chunk) => data += chunk);
    req.on('end', _ => {
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

      if (config.presetsDir) {
        const presetBlockId = encodeURIComponent(req.params.presetBlockId);

        fs.readdir(config.presetsDir, async (err, files) => {
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
                  (resolve, reject) => fs.readFile(`${config.presetsDir}/${file}`, (err, data) => {
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

      if (config.presetsDir) {
        const presetBlockId = encodeURIComponent(req.params.presetBlockId);
        const presetName = encodeURIComponent(req.params.presetName);

        fs.writeFile(`${config.presetsDir}/${presetBlockId}__${presetName}.json`, req.rawBody, (err) => {
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
      let transport = req.params.transport.toLowerCase();
      let transportConfig;
      let response;

      switch (transport) {
        case 'http':
        case 'https':
          transportConfig = config[transport] || config['http'] || {};

          delete req.headers.host;

          const url = new URL(req.params['0']);

          const options = {
            port: url.port,
            headers: ['Content-Length', 'Content-Type']
              .concat(transportConfig.allowHeaders || [])
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
            res.status(503).jsonp("Service unavailable");
          });

          proxyReq.write(req.rawBody);
          proxyReq.end();

          break;

        case 'nats':
          transportConfig = config['nats'] || {};
          transportConfig.env = env;

          response = await natsSend(
            transportConfig,
            req.params['0'],
            req.rawBody,
            ['Content-Length', 'Content-Type']
              .concat(config.nats && config.nats.allowHeaders || [])
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

        case 'natsrpc':
            transportConfig = config['natsrpc'] || config['nats'] || {};
            transportConfig.env = env;
  
            response = await natsSendRpc(
              transportConfig,
              req.params['0'],
              req.rawBody,
              ['Content-Length', 'Content-Type']
                .concat(config.nats && config.nats.allowHeaders || [])
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

        case 'rabbitmq':
          transportConfig = config['rabbitmq'] || {};
          transportConfig.env = env;

          response = await rabbitmqSend(
            transportConfig,
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
          transportConfig = config['rabbitmqrpc'] || config['rabbitmq'] || {};
          transportConfig.env = env;

          response = await getRabbitmqRpcDriver(transportConfig.drivers && transportConfig.drivers.rpc || 'amqplibRpc')(
            transportConfig,
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

        case 'redispub':
          transportConfig = config['redispub'] || config['redis'] || {};
          transportConfig.env = env;

          response = await redisSend(
            transportConfig,
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
          res.status(400).send(`Unknown transport "${req.params.transport.toLowerCase()}"`);
      }
    } catch (err) {
      console.error(err);

      res.status(500).json(err.message);
    }
  });

  return app;
}

/**
 * WebSocket
 */

async function createAppWebSocket(env) {
  const WebSocket = require('ws');
  const config = await getConfig(env);
  const routes = {};

  natsFlush();
  rabbitmqFlush();
  redisFlush();

  const app = {
    listen: (port, fn) => {
      const wsServer = app.wsServer = env.webSocketServerConstructor ? (env.webSocketServerConstructor({ port })) : new WebSocket.Server({ port });

      wsServer.on('connection', (ws, req) => {
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

        let route;

        if (uri.pathname in routes) {
          route = routes[uri.pathname];
        } else if (`/${uri.pathname.split('/', 2)[1]}` in routes) {
          route = routes[`/${uri.pathname.split('/', 2)[1]}`];
        }

        if (route) {
          ws.on('disconnect', _ => {
            console.info(`Incoming WebSocket connection closed: ${req.url}`);

            // remoteWs.terminate();
          });

          ws.on('error', (err) => {
            console.info(`Incoming WebSocket connection error: ${req.url}, ${err.message}`);

            // remoteWs.terminate();
          });

          route(ws, uri);
        } else {
          uri = uri.toString();

          const remoteWs = env.webSocketConstructor ? env.webSocketConstructor(uri) : new WebSocket(uri);

          let messageBuffer = [];

          remoteWs.onclose = _ => {
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

          remoteWs.onopen = _ => {
            for (const message of messageBuffer) {
              remoteWs.send(message);
            }
          };

          ws.on('disconnect', _ => {
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
        }
      });

      if (fn) {
        fn();
      }

      return app;
    },
    subscribe(route, fn) {
      routes[route] = fn;

      return app;
    },
    unsubscribe(route) {
      delete routes[route];

      return app;
    },
  };

  app.subscribe('/redissub', (ws, uri) => {
    console.log('ok');
  });

  return app;
}

async function getConfig(env) {
  const config = env && env.config || require('./apidog_proxy.config.js');

  if (typeof config === 'function') {
    config = await config();
  }

  return config;
}

/**
 * amqp
 */

let amqpConnections;

function rabbitmqFlush() {
  amqpConnections = {connections: {}, channels: {}};
}

function getRabbitmqRpcDriver(name) {
  switch (name) {
    case 'amqplibRpc':
      return rabbitmqSendRpcViaAmqplibRpcDriver;
  }

  throw new Error(`Unknown RabbitMQ RPC driver "${name}"`);
}

async function getAmqpConnection(config, uri) {
  if (uri.substr(0, 7) !== 'amqp://') {
    uri = `amqp://default`;
  }

  uri = new URL(uri);

  if (config[uri.hostname]) {
    const configEntry = new URL(config[uri.hostname]);

    uri.hostname = configEntry.hostname;
    uri.pathname = configEntry.pathname;
    uri.port = configEntry.port;
    uri.password = configEntry.password;
    uri.username = configEntry.username;
  }

  uri.pathname = uri.pathname.split('/').slice(1, 2).join('/');

  const key = `${uri.hostname}${uri.port}${uri.username}${uri.password}${uri.pathname}`;

  if (!amqpConnections.connections[key]) {
    amqpConnections.connections[key] = await (config.env && config.env.amqplib || require('amqplib')).connect(uri.toString());
  }

  return amqpConnections.connections[key];
}

async function getAmqpChannel(config, uri) {
  if (uri.substr(0, 7) !== 'amqp://') {
    uri = `amqp://default`;
  }

  uri = new URL(uri);

  if (config[uri.hostname]) {
    const configEntry = new URL(config[uri.hostname]);

    uri.hostname = configEntry.hostname;
    uri.pathname = configEntry.pathname;
    uri.port = configEntry.port;
    uri.password = configEntry.password;
    uri.username = configEntry.username;
  }

  uri.pathname = uri.pathname.split('/').slice(1, 2).join('/');

  const key = `${uri.hostname}${uri.port}${uri.username}${uri.password}${uri.pathname}`;

  const connection = await getAmqpConnection(config, uri.toString());

  amqpConnections.channels[key] = await connection.createChannel();

  return amqpConnections.channels[key];
}

async function rabbitmqSend(config, queue, data, headers, opts) {
  const amqpChannel = await getAmqpChannel(config, queue);
  const q = queue.substr(queue.lastIndexOf('/') + 1);
  const amqpQueue = await amqpChannel.assertQueue(q);
  const status = await amqpChannel.sendToQueue(q, Buffer.from(data), {
    headers: headers || {}, ...opts
  });

  return {
    body: `Message has been sent to RabbitMQ "${queue}" queue by apiDog proxy`,
    headers: {},
  };
}

async function rabbitmqSendRpcViaAmqplibRpcDriver(config, queue, data, headers, opts) {
  const amqpConnection = await getAmqpConnection(config, queue);
  const q = queue.substr(queue.lastIndexOf('/') + 1);
  const req = (config.env && config.env.amqplibRpc || require('amqplib-rpc')).request;
  const res = await req(amqpConnection, q, data, {
    sendOpts: { contentType: headers['Content-Type'], headers: headers || {}, ...opts },
  });

  return {
    body: res.content.toString('utf8'),
    headers: {...res.properties.headers, 'Content-Type': res.properties.contentType || 'text/html'},
  };
}

/**
 * nats
 */

let natsConnections;

function natsFlush() {
  natsConnections = {};
}

async function getNatsConnection(config, uri) {
  if (uri.substr(0, 7) !== 'nats://') {
    uri = `nats://default`;
  }

  uri = new URL(uri);

  if (config[uri.hostname]) {
    const configEntry = new URL(config[uri.hostname]);

    uri.hostname = configEntry.hostname;
    // uri.pathname = configEntry.pathname;
    uri.port = configEntry.port;
    uri.password = configEntry.password;
    uri.username = configEntry.username;
  }

  uri.pathname = '';

  const key = `${uri.hostname}${uri.port}${uri.username}${uri.password}${uri.pathname}`;

  if (!natsConnections[key]) {
    natsConnections[key] = await (config.env && config.env.nats || require('nats')).connect(uri.toString());
  }

  return natsConnections[key];
}

async function natsSend(config, queue, data, headers, opts) {
  const natsConnection = await getNatsConnection(config, queue);
  const q = queue.substr(queue.lastIndexOf('/') + 1);
  natsConnection.publish(q, data);

  return {
    body: `Message has been sent to Nats "${queue}" queue by apiDog proxy`,
    headers: {},
  };
}

async function natsSendRpc(config, queue, data, headers, opts) {
  const natsConnection = await getNatsConnection(config, queue);
  const q = queue.substr(queue.lastIndexOf('/') + 1);

  return new Promise((resolve, reject) => natsConnection.requestOne(q, data, {}, config.timeout || 60000, (res) => {
    res instanceof Error
      ? reject(res)
      : resolve({body: res, headers: {}});
  }));
}

/**
 * redis
 */

let redisConnections;

function redisFlush() {
  redisConnections = {};
}

async function getRedisConnection(config, uri) {
  if (uri.substr(0, 8) !== 'redis://') {
    uri = `redis://default`;
  }

  uri = new URL(uri);

  if (config[uri.hostname]) {
    const configEntry = new URL(config[uri.hostname]);

    uri.hostname = configEntry.hostname;
    // uri.pathname = configEntry.pathname;
    uri.port = configEntry.port;
    uri.password = configEntry.password;
    // uri.username = configEntry.username;
  }

  uri.pathname = '';

  const key = `${uri.hostname}${uri.port}${uri.username}${uri.password}${uri.pathname}`;

  if (!redisConnections[key]) {
    redisConnections[key] = await (config.env && config.env.redis || require('redis')).createClient(uri.toString());
  }

  return redisConnections[key];
}

async function redisSend(config, queue, data, headers, opts) {
  const redisConnection = await getRedisConnection(config, queue);
  const q = queue.substr(queue.lastIndexOf('/') + 1);
  redisConnection.publish(q, data);

  return {
    body: `Message has been sent to Redis "${queue}" channel by apiDog proxy`,
    headers: {},
  };
}

/**
 * bootstrap
 */

(async _ => {
  if (process.env.NODE_ENV !== 'test') {
    const config = await getConfig();

    if (config.websocket && config.websocket.allow) {
      (await createAppWebSocket({})).listen(
        config.websocket.proxyPort || 8089,
        _ => console.log(`ApiDog WebSocket proxy started on ${config.websocket.proxyPort || 8089}`)
      );
    }

    if ((config.http && config.http.allow) || (config.https && config.https.allow)) {
      (await createAppHttp({})).listen(
        config.http.proxyPort || 8088,
        _ => console.log(`ApiDog HTTP proxy started on ${config.http.proxyPort || 8088}`)
      );
    }
  }
})();

module.exports = {
  createAppHttp,
  createAppWebSocket,
};
