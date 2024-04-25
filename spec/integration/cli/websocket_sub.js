const WebSocket = require('ws');

const wsServer = new WebSocket.Server({ port: 80 });

wsServer.on('connection', (ws, req) => {
  ws.on('message', (msg) => {
    console.log(msg);

    ws.send('ok');
  });
});
