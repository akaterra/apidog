const request = require('supertest');
const WebSocket = require('ws');

describe('proxy', () => {
  let app;
  let env;

  async function initAmqpEnv(response, config) {
    env = {};
    app = await require('../src/templates/apidog_proxy').createAppHttp(env);
  }

  it('should return 400 on unknown transport', async () => {
    await initAmqpEnv({ content: { toString: () => 'data' }, properties: {} });

    return request(app)
      .post('/unknown/uri')
      .set('Content-Type', 'application/json')
      .send({
        test: 'test',
      })
      .expect(400)
      .expect(res => {
        expect(res.text).toBe('Unknown transport "unknown"');
      });
  });
});
