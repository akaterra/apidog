const nats = require('nats');

(async () => {
  const connection = await nats.connect({ service: [ 'nats://127.0.0.1:4222' ] });

  connection.subscribe('subscribe', { callback: (err, msg) => console.log(msg) });
  connection.subscribe('publish', { callback: (err, msg) => console.log(msg) });
  connection.subscribe('rpc', { callback: (err, msg) => {
    console.log(msg);

    msg.respond('ok');
  } });
})();
