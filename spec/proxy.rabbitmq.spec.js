const request = require('supertest');
const WebSocket = require('ws');

describe('proxy rabbitmq', () => {
  let app;
  let env;

  async function initAmqpEnv(response, config) {
    env = {
      amqplib: {
        connect: (uri) => {
          env.$amqplibConnection = {
            assertQueue: (queue) => env.$amqplibAssertQueue = {queue},
            createChannel: () => env.$amqplibConnection,
            sendToQueue: (queue, data, opts) => {
              env.$amqplibSent = {queue, data, opts};

              return response;
            },
            uri,
          };

          return env.$amqplibConnection;
        }
      },
      amqplibRpc: {
        request: (connection, queue, data, opts) => {
          env.$amqplibRpcRequest = {connection, queue, data, opts};

          return response;
        }
      },
      config: config || {},
    };

    app = await require('../src/templates/apidog_proxy').createAppHttp(env);
  }

  it('should process request', async () => {
    await initAmqpEnv({});

    return request(app)
      .post('/rabbitmq/queue')
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

  it('should process request with full uri', async () => {
    await initAmqpEnv({});

    return request(app)
      .post('/rabbitmq/amqp://username:password@host:9999/vhost/queue')
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

  it('should process request with alias of uri', async () => {
    await initAmqpEnv(undefined, {rabbitmq: {alias: 'amqp://a:b@c:1/e'}});

    return request(app)
      .post('/rabbitmq/amqp://alias/queue')
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
});
