const request = require('supertest');
const requestWs = require('./lib/request_ws').requestWs;

describe('proxy redis', () => {
  let app;
  let appWs;
  let env;

  async function initRedisEnv(response, config) {
    env = {
      $response: response,
      $redisHandlers: {},
      redis: {
        $setResponse(response) {
          env.$response = response;

          return env;
        },
        $publish(channel, message) {
          if (env.$redisHandlers.message) {
            if (!env.$redisSubscribe || env.$redisSubscribe.channel === channel) {
              env.$redisHandlers.message(channel, message);
            }
          }

          return env;
        },
        createClient(uri) {
          env.$redisClient = {
            uri,
            on(event, fn) {
              env.$redisHandlers[event] = fn;
            },
            publish(channel, message) {
              env.$redisPublish = {channel, message};
            },
            subscribe(channel) {
              env.$redisSubscribe = {channel};
            },
          }

          return env.$redisClient;
        },
      },
      config: config || {},
    };

    if (!env.config.redis) {
      env.config.redis = {};
    }

    env.config.redis.allow = true;

    app = await require('../src/templates/apidog_proxy').createAppHttp(env);
    appWs = (await require('../src/templates/apidog_proxy').createAppWebSocket(env)).listen(8008);
  }

  afterEach(async () => {
    await appWs.shutdown();
  });

  it('should process pub request', async () => {
    await initRedisEnv({});

    return request(app)
      .post('/redispub/channel')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$redisPublish).toEqual({channel: 'channel', message: '{"test":"test"}'});
        expect(env.$redisClient.uri).toBe('redis://default');
        expect(res.text).toBe('Message has been sent to Redis "channel" channel by apiDog proxy');
      });
  });

  it('should process pub request with full uri', async () => {
    await initRedisEnv({});

    return request(app)
      .post('/redispub/redis://username:password@host:9999/channel')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$redisPublish).toEqual({channel: 'channel', message: '{"test":"test"}'});
        expect(env.$redisClient.uri).toBe('redis://username:password@host:9999');
        expect(res.text).toBe('Message has been sent to Redis "redis://username:password@host:9999/channel" channel by apiDog proxy');
      });
  });

  it('should process pub request with alias of uri', async () => {
    await initRedisEnv(undefined, {redis: {alias: 'redis://a:b@c:1'}});

    return request(app)
      .post('/redispub/redis://alias/channel')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(200)
      .expect(res => {
        expect(env.$redisPublish).toEqual({channel: 'channel', message: '{"test":"test"}'});
        expect(env.$redisClient.uri).toBe('redis://:b@c:1');
        expect(res.text).toBe('Message has been sent to Redis "redis://alias/channel" channel by apiDog proxy');
      });
  });

  it('should process sub request', async () => {
    await initRedisEnv({});

    const req = requestWs(appWs);

    return req
      .send('/redissub/channel', {
        test: 'test',
      })
      .do(() => {
        env.redis.$publish('channel', 'response');
      })
      .expect((res, ws) => {
        expect(res).toBe('response');
      });
  });
});
