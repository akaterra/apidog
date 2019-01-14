const request = require('supertest');

describe('proxy', () => {
  let app;
  let env;

  function initAmqpEnv(response) {
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
      config: {},
    };

    app = require('../src/templates/proxy').createApp(env);
  }

  it('should process rabbitmq request', async () => {
    initAmqpEnv({});

    return request(app)
      .post('/rabbitmq/connection/queue')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.amqplibQueue).toBe('queue');
        expect(env.amqplibConnection.uri).toBe('connection');
        expect(res.text).toBe('true');
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
        expect(env.amqplibConnection.uri).toBe('connection');
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
