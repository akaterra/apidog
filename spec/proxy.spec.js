const request = require('supertest');
const WebSocket = require('ws');

describe('proxy', () => {
  let app;
  let env;

  function initAmqpEnv(response, config) {
    env = {
      amqplib: {
        connect: (uri) => {
          env.amqplibConnection = {
            assertQueue: (queue) => env.amqplibQueue = queue,
            createChannel: () => env.amqplibConnection,
            sendToQueue: (queue, data, opts) => {
              env.amqplibSent = {queue, data, opts};

              return response;
            },
            uri,
          };

          return env.amqplibConnection;
        }
      },
      amqplibRpc: {
        request: (connection, queue, data, opts) => {
          env.amqplibRpcSent = {connection, queue, data, opts};

          return response;
        }
      },
      config: config || {},
    };

    app = require('../src/templates/apidog_proxy').createApp(env);
  }

  function initWebSocketEnv(response, config) {
    env = {
      webSocketServerConstructor() {
        const server = {
          $connect() {
            server.$connected = true;

            server.$handlers['connection']({
              on(event, handler) {
                server.$handlers[event] = handler;

                return server;
              },
              send(message) {
                server.$ws.message = message;

                return server;
              },
              terminate() {
                server.$ws.terminated = true;

                return server;
              },
            }, {
              url: 'url',
            });

            return server;
          },
          $disconnect() {
            server.$handlers.disconnect();

            return server;
          },
          $error(err) {
            server.$handlers.error(err);

            return server;
          },
          $message(message) {
            server.$handlers.message(message);

            return server;
          },
          $handlers: {

          },
          $ws: {

          },
          on(event, handler) {
            server.$handlers[event] = handler;

            return server;
          },
        };

        env.server = server;

        return server;
      },
      webSocketConstructor() {
        const client = {
          $handlers: {

          },
          $ws: {
            messages: [],
          },
          $setClosedReadyState() {
            client.readyState = WebSocket.CLOSED;

            return client;
          },
          $setClosingReadyState() {
            client.readyState = WebSocket.CLOSING;

            return client;
          },
          $setConnectingReadyState() {
            client.readyState = WebSocket.CONNECTING;

            return client;
          },
          $setOpenReadyState() {
            client.readyState = WebSocket.OPEN;

            return client;
          },
          readyState: WebSocket.CONNECTING,
          send(message) {
            client.$ws.messages.push(message);

            return client;
          },
          terminate() {
            client.$ws.terminated = true;

            return client;
          },
          on(event, handler) {
            client.$handlers[event] = handler;

            return client;
          },
        };

        env.client = client;

        return client;
      },
      config: config || {},
    };

    app = require('../src/templates/apidog_proxy').createAppWebSocket(env);
  }

  describe('when uses rabbitmq', () => {
    it('should process rabbitmq request', async () => {
      initAmqpEnv({});

      return request(app)
        .post('/rabbitmq/queue')
        .set('Content-Type', 'application/json')
        .send({
          test: 'test',
        })
        .expect(200)
        .expect(res => {
          expect(env.amqplibQueue).toBe('queue');
          expect(env.amqplibConnection.uri).toBe('amqp://default');
          expect(res.text).toBe('Message has been sent to "queue" queue by ApiDog proxy');
        });
    });

    it('should process rabbitmq request with full uri', async () => {
      initAmqpEnv({});

      return request(app)
        .post('/rabbitmq/amqp://username:password@host:9999/vhost/queue')
        .set('Content-Type', 'application/json')
        .send({
          test: 'test',
        })
        .expect(200)
        .expect(res => {
          expect(env.amqplibQueue).toBe('queue');
          expect(env.amqplibConnection.uri).toBe('amqp://username:password@host:9999/vhost');
          expect(res.text).toBe('Message has been sent to "amqp://username:password@host:9999/vhost/queue" queue by ApiDog proxy');
        });
    });

    it('should process rabbitmq request with alias of uri', async () => {
      initAmqpEnv(undefined, {amqp: {alias: 'amqp://a:b@c:1/e'}});

      return request(app)
        .post('/rabbitmq/amqp://alias/queue')
        .set('Content-Type', 'application/json')
        .send({
          test: 'test',
        })
        .expect(200)
        .expect(res => {
          expect(env.amqplibQueue).toBe('queue');
          expect(env.amqplibConnection.uri).toBe('amqp://a:b@c:1/e');
          expect(res.text).toBe('Message has been sent to "amqp://alias/queue" queue by ApiDog proxy');
        });
    });

    it('should process rabbitmqRpc request', async () => {
      initAmqpEnv({ content: { toString: () => 'data' }, properties: {} });

      return request(app)
        .post('/rabbitmqRpc/connection/queue')
        .set('Content-Type', 'application/json')
        .send({
          test: 'test',
        })
        .expect(200)
        .expect(res => {
          expect(env.amqplibRpcSent.queue).toBe('queue');
          expect(env.amqplibConnection.uri).toBe('amqp://default');
          expect(res.text).toBe('data');
        });
    });

    it('should process rabbitmq request with full uri', async () => {
      initAmqpEnv({ content: { toString: () => 'data' }, properties: {} });

      return request(app)
        .post('/rabbitmqRpc/amqp://username:password@host:9999/vhost/queue')
        .set('Content-Type', 'application/json')
        .send({
          test: 'test',
        })
        .expect(200)
        .expect(res => {
          expect(env.amqplibRpcSent.queue).toBe('queue');
          expect(env.amqplibConnection.uri).toBe('amqp://username:password@host:9999/vhost');
          expect(res.text).toBe('data');
        });
    });

    it('should return 400 on unknown transport', async () => {
      initAmqpEnv({ content: { toString: () => 'data' }, properties: {} });

      return request(app)
        .post('/unknown/uri')
        .set('Content-Type', 'application/json')
        .send({
          test: 'test',
        })
        .expect(400)
        .expect(res => {
          expect(res.text).toBe('Unknown transport');
        });
    });
  });

  describe('when uses websocket', () => {
    it('should initiate websocket server connection', async () => {
      initWebSocketEnv({});

      app.listen();

      env.server.$connect();

      expect(env.server.$connected).toBeTruthy();
    });

    it('should initiate websocket client connection on server connection', async () => {
      initWebSocketEnv({});

      app.listen();

      env.server.$connect();

      expect(env.client).not.toBeUndefined();
    });

    it('should terminate websocket client connection on server disconnection', async () => {
      initWebSocketEnv({});

      app.listen();

      env.server.$connect();

      env.server.$disconnect();

      expect(env.client.$ws.terminated).toBeTruthy();
    });

    it('should terminate websocket client connection on server error', async () => {
      initWebSocketEnv({});

      app.listen();

      env.server.$connect();

      env.server.$error(new Error('error'));

      expect(env.client.$ws.terminated).toBeTruthy();
    });

    it('should terminate websocket server connection on client disconnection', async () => {
      initWebSocketEnv({});

      app.listen();

      env.server.$connect();

      env.client.onclose();

      expect(env.server.$ws.terminated).toBeTruthy();
    });

    it('should terminate websocket server connection on client error', async () => {
      initWebSocketEnv({});

      app.listen();

      env.server.$connect();

      env.client.onerror(new Error('error'));

      expect(env.server.$ws.terminated).toBeTruthy();
    });

    it('should pass websocket server message to client buffer in case of not ready connection on server message', async () => {
      initWebSocketEnv({});

      app.listen();

      env.server.$connect();
      env.client.$setConnectingReadyState();
      env.server.$message('message');

      expect(env.client.$ws.messages).toEqual([]);
    });

    it('should pass websocket server message to client in case of ready connection on server message', async () => {
      initWebSocketEnv({});

      app.listen();

      env.server.$connect();
      env.client.$setOpenReadyState();
      env.server.$message('message');

      expect(env.client.$ws.messages).toEqual(['message']);
    });

    it('should pass buffered websocket server message to client in case of ready connection on server message', async () => {
      initWebSocketEnv({});

      app.listen();

      env.server.$connect().$message('message');
      env.client.$setOpenReadyState();
      env.client.onopen();

      expect(env.client.$ws.messages).toEqual(['message']);
    });

    it('should pass websocket client message to server connection on client message', async () => {
      initWebSocketEnv({});

      app.listen();

      env.server.$connect();
      env.client.$setOpenReadyState();
      env.client.onmessage({data: 'message'});

      expect(env.server.$ws.message).toEqual('message');
    });
  });
});
