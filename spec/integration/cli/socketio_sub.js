const socketio = require('socket.io');

const io = socketio(undefined, { cors: { domain: '*' } });

io.of('/communicate').on('connection', (ws) => {
  ws.on('message', (msg) => {
    console.log(msg);

    ws.send('ok');
  });
});

io.listen(80);
