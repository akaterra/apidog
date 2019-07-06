const request = require('supertest');

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
