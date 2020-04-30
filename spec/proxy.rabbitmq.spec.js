const request = require('supertest');
const requestWs = require('./lib/request_ws').requestWs;

describe('proxy rabbitmq', () => {
  let app;
  let env;

  async function initAmqpEnv(response, config) {
    env = {
      $response: response,
      $rabbitmqHandlers: {},
      $rabbitmqSubscriptions: {},
      amqplib: {
        $setResponse(response) {
          env.$response = response;

          return env;
        },
        $publish(queue, message) {
          if (env.$rabbitmqSubscriptions[queue]) {
            env.$rabbitmqSubscriptions[queue].fn({content: message});
          }

          return env;
        },
        connect(uri) {
          env.$amqplibConnection = {
            uri,
            assertQueue(queue) {
              env.$amqplibAssertQueue = {queue};
            },
            consume(queue, fn, opts) {
              env.$rabbitmqSubscriptions[queue] = {fn, opts};
            },
            createChannel() {
              return env.$amqplibConnection;
            },
            sendToQueue(queue, data, opts) {
              env.$amqplibSent = {queue, data, opts};
            },
          };

          return env.$amqplibConnection;
        }
      },
      amqplibRpc: {
        request(connection, queue, data, opts) {
          env.$amqplibRpcRequest = {connection, queue, data, opts};

          return response;
        }
      },
      config: config || {},
    };

    if (!env.config.rabbitmq) {
      env.config.rabbitmq = {};
    }

    env.config.rabbitmq.allow = true;

    app = await require('../src/templates/apidog_proxy').createAppHttp(env);
    appWs = (await require('../src/templates/apidog_proxy').createAppWebSocket(env)).listen(8008);
  }

  afterEach(async () => {
    await appWs.shutdown();
  });

  it('should process pub request', async () => {
    await initAmqpEnv({});

    return request(app)
      .post('/rabbitmqpub/queue')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$amqplibAssertQueue.queue).toBe('queue');
        expect(env.$amqplibConnection.uri).toBe('amqp://default');
        expect(res.text).toBe('Message has been sent to RabbitMQ "queue" queue by apiDog proxy');
      });
  });

  it('should process pub request with full uri', async () => {
    await initAmqpEnv({});

    return request(app)
      .post('/rabbitmqpub/amqp://username:password@host:9999/vhost/queue')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$amqplibAssertQueue.queue).toBe('queue');
        expect(env.$amqplibConnection.uri).toBe('amqp://username:password@host:9999/vhost');
        expect(res.text).toBe('Message has been sent to RabbitMQ "amqp://username:password@host:9999/vhost/queue" queue by apiDog proxy');
      });
  });

  it('should process pub request with alias of uri', async () => {
    await initAmqpEnv(undefined, {rabbitmq: {alias: 'amqp://a:b@c:1/e'}});

    return request(app)
      .post('/rabbitmqpub/amqp://alias/queue')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$amqplibAssertQueue.queue).toBe('queue');
        expect(env.$amqplibConnection.uri).toBe('amqp://a:b@c:1/e');
        expect(res.text).toBe('Message has been sent to RabbitMQ "amqp://alias/queue" queue by apiDog proxy');
      });
  });

  it('should process rpc request', async () => {
    await initAmqpEnv({ content: { toString: () => 'data' }, properties: {} });

    return request(app)
      .post('/rabbitmqrpc/connection/queue')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$amqplibRpcRequest.queue).toBe('queue');
        expect(env.$amqplibConnection.uri).toBe('amqp://default');
        expect(res.text).toBe('data');
      });
  });

  it('should process rpc request with full uri', async () => {
    await initAmqpEnv({ content: { toString: () => 'data' }, properties: {} });

    return request(app)
      .post('/rabbitmqrpc/amqp://username:password@host:9999/vhost/queue')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$amqplibRpcRequest.queue).toBe('queue');
        expect(env.$amqplibConnection.uri).toBe('amqp://username:password@host:9999/vhost');
        expect(res.text).toBe('data');
      });
  });

  it('should process sub request', async () => {
    await initAmqpEnv({});

    const req = requestWs(appWs);

    return req
      .send('/rabbitmqsub/channel', {
        test: 'test',
      })
      .do(() => {
        env.amqplib.$publish('channel', 'response');
      })
      .expect((res, ws) => {
        expect(res).toBe('response');
      });
  });
});
