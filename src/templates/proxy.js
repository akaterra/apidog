const express = require('express');
const http = require('http');
const https = require('https');
const qs = require('qs');
const URL = require('url').URL;

function createApp(env) {
  const config = env && env.config || require('./config.js');
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

            for (const key of Object.keys(proxyRes.headers)) {
              res.setHeader(key, proxyRes.headers[key]);
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

          Object.keys(response.headers).forEach((key) => {
            res.header(key, response.headers[key]);
          });

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

          Object.keys(response.headers).forEach((key) => {
            res.header(key, response.headers[key]);
          });

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
    let uriSelected = uri;

    if (uri.substr(0, 7) !== 'amqp://') {
      if (uri.lastIndexOf('/') !== - 1) {
        uriSelected = uri.substr(0, uri.lastIndexOf('/'));
      } else {
        uriSelected = 'default';
      }
    }

    if (amqpConnections[uriSelected]) {
      return amqpConnections[uriSelected];
    }

    if (config.amqp && config.amqp[uriSelected]) {
      uriSelected = config.amqp[uriSelected];
    }

    amqpConnections[uriSelected] = await (env && env.amqplib || require('amqplib')).connect(uriSelected);

    return amqpConnections[uriSelected];
  }

  async function getAmqpChannel(uri) {
    let uriSelected = uri;

    if (uri.substr(0, 7) !== 'amqp://') {
      if (uri.lastIndexOf('/') !== - 1) {
        uriSelected = uri.substr(0, uri.lastIndexOf('/'));
      } else {
        uriSelected = 'default';
      }
    }

    if (amqpChannels[uriSelected]) {
      return amqpChannels[uriSelected];
    }

    if (config.amqp && config.amqp[uriSelected]) {
      uri = config.amqp[uriSelected];
    }

    amqpChannels[uriSelected] = await (await getAmqpConnection(uri)).createChannel();

    return amqpChannels[uriSelected];
  }

  async function amqpSend(queue, data, headers, opts) {
    const amqpChannel = await getAmqpChannel(queue);
    const amqpQueue = await amqpChannel.assertQueue(queue.substr(queue.lastIndexOf('/') + 1));
    const status = await amqpChannel.sendToQueue(queue.substr(queue.lastIndexOf('/') + 1), Buffer.from(data), {
      headers: headers || {}, ...opts
    });

    return {
      body: true,
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

if (process.env.NODE_ENV !== 'test') {
  const config = require('./config.js');

  createApp({}).listen(config.port || 8088, () => console.log(`ApiDog proxy started on ${config.port || 8088}`));
}

module.exports = {
  createApp,
};
