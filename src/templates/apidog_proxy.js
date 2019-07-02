const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const qs = require('qs');
const URL = require('url').URL;

function createApp(env) {
  const config = env && env.config || require('./apidog_proxy_config.js');
  const app = express();

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
      config.cors && config.cors.allowedHeaders
        ? config.cors.allowedHeaders
        : '*'
    );
    res.header(
      'Access-Control-Allow-Methods',
      config.cors && config.cors.allowedMethods
        ? config.cors.allowedMethods
        : 'DELETE,GET,HEAD,INFO,OPTIONS,PATCH,POST,PUT'
    );
    res.header('Access-Control-Allow-Origin', '*');

    res.status(200).send();
  });

  app.get('/preset/:presetBlockId', async (req, res) => {
    if (config.presetDir) {

    } else {
      res.status(501).send('Preset directory is not configured');
    }
  });

  app.put('/preset/:presetBlockId/:presetName', async (req, res) => {
    if (config.presetDir) {
      fs.writeFile(`${config.presetDir}/${req.params.presetBlockId}_${req.params.presetName}.json`, req.rawBody, (err) => {
        if (err) {
          res.status(500).send(err.message);
        } else {
          res.status(200).send();
        }
      });
    } else {
      res.status(501).send('Preset directory is not configured');
    }
  });

  function safeName(name) {
    return name;
  }

  app.all('/:transport/*', async (req, res) => {
    res.header(
      'Access-Control-Allow-Headers',
      config.cors && config.cors.allowedHeaders
        ? config.cors.allowedHeaders
        : '*'
    );
    res.header(
      'Access-Control-Allow-Methods',
      config.cors && config.cors.allowedMethods
        ? config.cors.allowedMethods
        : 'DELETE,GET,HEAD,INFO,OPTIONS,PATCH,POST,PUT'
    );
    res.header('Access-Control-Allow-Origin', '*');

    try {
      let response;

      switch (req.params.transport) {
        case 'http':
        case 'https':
          delete req.headers.host;

          const url = new URL(req.params['0']);

          const options = {
            port: url.port,
            headers: ['Content-Length', 'Content-Type']
              .concat(config.http && config.http.allowedHeaders || [])
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
              .concat(config.amqp && config.amqp.allowedHeaders || [])
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

        case 'rabbitmqRpc':
          response = await amqpRpcSend(
            req.params['0'],
            req.rawBody,
            ['Content-Length', 'Content-Type']
              .concat(config.amqp && config.amqp.allowedHeaders || [])
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

      res.status(500).send(String(err));
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

    if (! amqpConnections[key]) {
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

(async () => {
  if (process.env.NODE_ENV !== 'test') {
    const config = require('./apidog_proxy_config.js');

    if (typeof config === 'function') {
      config = await config();
    }

    createApp({}).listen(config.port || 8088, () => console.log(`ApiDog proxy started on ${config.port || 8088}`));
  }
})();

module.exports = {
  createApp,
};
