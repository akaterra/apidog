const WebSocket = require('ws');

describe('proxy websocket', () => {
  let app;
  let env;

  async function initWebSocketEnv(response, config) {
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

    app = await require('../src/templates/apidog_proxy').createAppWebSocket(env);
  }

  it('should initiate server connection', async () => {
    await initWebSocketEnv({});

    app.listen();

    env.server.$connect();

    expect(env.server.$connected).toBeTruthy();
  });

  it('should initiate client connection on server connection', async () => {
    await initWebSocketEnv({});

    app.listen();

    env.server.$connect();

    expect(env.client).not.toBeUndefined();
  });

  it('should terminate client connection on server disconnection', async () => {
    await initWebSocketEnv({});

    app.listen();

    env.server.$connect();

    env.server.$disconnect();

    expect(env.client.$ws.terminated).toBeTruthy();
  });

  it('should terminate client connection on server error', async () => {
    await initWebSocketEnv({});

    app.listen();

    env.server.$connect();

    env.server.$error(new Error('error'));

    expect(env.client.$ws.terminated).toBeTruthy();
  });

  it('should terminate server connection on client disconnection', async () => {
    await initWebSocketEnv({});

    app.listen();

    env.server.$connect();

    env.client.onclose();

    expect(env.server.$ws.terminated).toBeTruthy();
  });

  it('should terminate server connection on client error', async () => {
    await initWebSocketEnv({});

    app.listen();

    env.server.$connect();

    env.client.onerror(new Error('error'));

    expect(env.server.$ws.terminated).toBeTruthy();
  });

  it('should pass server message to client buffer in case of not ready connection on server message', async () => {
    await initWebSocketEnv({});

    app.listen();

    env.server.$connect();
    env.client.$setConnectingReadyState();
    env.server.$message('message');

    expect(env.client.$ws.messages).toEqual([]);
  });

  it('should pass server message to client in case of ready connection on server message', async () => {
    await initWebSocketEnv({});

    app.listen();

    env.server.$connect();
    env.client.$setOpenReadyState();
    env.server.$message('message');

    expect(env.client.$ws.messages).toEqual(['message']);
  });

  it('should pass buffered server message to client in case of ready connection on server message', async () => {
    await initWebSocketEnv({});

    app.listen();

    env.server.$connect().$message('message');
    env.client.$setOpenReadyState();
    env.client.onopen();

    expect(env.client.$ws.messages).toEqual(['message']);
  });

  it('should pass client message to server connection on client message', async () => {
    await initWebSocketEnv({});

    app.listen();

    env.server.$connect();
    env.client.$setOpenReadyState();
    env.client.onmessage({data: 'message'});

    expect(env.server.$ws.message).toEqual('message');
  });
});
