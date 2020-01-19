const request = require('supertest');
const requestWs = require('./lib/request_ws').requestWs;

describe('proxy nats', () => {
  let app;
  let env;

  async function initNatsEnv(response, config) {
    env = {
      $response: response,
      nats: {
        $setResponse: (response) => {
          env.$response = response;

          return env;
        },
        connect: (uri) => {
          env.$natsConnection = {
            publish: (queue, data) => env.$natsPublish = {queue, data},
            requestOne: (queue, data, opts, timeout, fn) => {
              env.$natsRequestOne = {queue, data, timeout, opts, fn};

              if (fn) {
                fn(env.$response);
              }
            },
            uri,
          };

          return env.$natsConnection;
        }
      },
      config: config || {},
    };

    if (!env.config.nats) {
      env.config.nats = {};
    }

    env.config.nats.allow = true;

    app = await require('../src/templates/apidog_proxy').createAppHttp(env);
  }

  it('should process pub request', async () => {
    await initNatsEnv({});

    return request(app)
      .post('/natspub/queue')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$natsPublish.queue).toBe('queue');
        expect(env.$natsConnection.uri).toBe('nats://default');
        expect(res.text).toBe('Message has been sent to Nats "queue" queue by apiDog proxy');
      });
  });

  it('should process pub request with full uri', async () => {
    await initNatsEnv({});

    return request(app)
      .post('/natspub/nats://username:password@host:9999/queue')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$natsPublish.queue).toBe('queue');
        expect(env.$natsConnection.uri).toBe('nats://username:password@host:9999');
        expect(res.text).toBe('Message has been sent to Nats "nats://username:password@host:9999/queue" queue by apiDog proxy');
      });
  });

  it('should process pub request with alias of uri', async () => {
    await initNatsEnv(undefined, {nats: {alias: 'nats://a:b@c:1'}});

    return request(app)
      .post('/natspub/nats://alias/queue')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$natsPublish.queue).toBe('queue');
        expect(env.$natsConnection.uri).toBe('nats://a:b@c:1');
        expect(res.text).toBe('Message has been sent to Nats "nats://alias/queue" queue by apiDog proxy');
      });
  });

  it('should process rpc request', async () => {
    await initNatsEnv('data');

    return request(app)
      .post('/natsrpc/connection/queue')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$natsRequestOne.queue).toBe('queue');
        expect(env.$natsConnection.uri).toBe('nats://default');
        expect(res.text).toBe('data');
      });
  });

  it('should process rpc request with full uri', async () => {
    await initNatsEnv('data');

    return request(app)
      .post('/natsrpc/nats://username:password@host:9999/queue')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$natsRequestOne.queue).toBe('queue');
        expect(env.$natsConnection.uri).toBe('nats://username:password@host:9999');
        expect(res.text).toBe('data');
      });
  });
});
