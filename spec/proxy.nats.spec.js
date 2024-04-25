const request = require('supertest');
const requestWs = require('./lib/request_ws').requestWs;

describe('proxy nats', () => {
  let app;
  let env;

  async function initNatsEnv(response, config) {
    env = {
      $response: response,
      $natsHandlers: {},
      $natsSubscriptions: {},
      nats: {
        $setResponse(response) {
          env.$response = response;

          return env;
        },
        $publish(queue, message) {
          if (env.$natsSubscriptions[queue]) {
            env.$natsSubscriptions[queue].opts.callback(null, { string: () => message });
          }

          return env;
        },
        connect(uri) {
          env.$natsConnection = {
            uri,
            on(event, fn) {
              env.$natsHandlers[event] = fn;
            },
            publish(queue, data) {
              env.$natsPublish = {queue, data}
            },
            subscribe(queue, opts) {
              env.$natsSubscriptions[queue] = {opts};
            },
            request: (queue, data, opts) => {
              env.$natsRequestOne = {queue, data, opts};

              if (env.$response instanceof Error) {
                return Promise.reject(err);
              } else {
                return Promise.resolve({ string: () => env.$response });
              }
            },
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
    appWs = (await require('../src/templates/apidog_proxy').createAppWebSocket(env)).listen(8008);
  }

  afterEach(async () => {
    await appWs.shutdown();
  });

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
        expect(env.$natsConnection.uri).toEqual({ servers: [ 'nats://default' ] });
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
        expect(env.$natsConnection.uri).toEqual({ servers: [ 'nats://username:password@host:9999' ] });
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
        expect(env.$natsConnection.uri).toEqual({ servers: [ 'nats://a:b@c:1' ] });
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
        expect(env.$natsConnection.uri).toEqual({ servers: [ 'nats://default' ] });
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
        expect(env.$natsConnection.uri).toEqual({ servers: [ 'nats://username:password@host:9999' ] });
        expect(res.text).toBe('data');
      });
  });

  it('should process sub request', async () => {
    await initNatsEnv();

    const req = requestWs(appWs);

    return req
      .send('/natssub/channel', {
        test: 'test',
      })
      .do(() => {
        env.nats.$publish('channel', 'response');
      })
      .expect((res, ws) => {
        expect(res).toBe('response');
      });
  });
});
