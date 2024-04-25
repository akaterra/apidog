const amqp = require('amqplib');
const {headers} = require('nats');

(async() => {
  const connection = await amqp.connect('amqp://127.0.0.1:5672');
  const channel = await connection.createChannel();
  await channel.assertQueue('subscribe');
  await channel.consume('subscribe', (msg) => {
    console.log(msg);
  });
  await channel.assertQueue('publish');
  await channel.consume('publish', (msg) => {
    console.log(msg);
  });
  await channel.assertQueue('rpc');
  await channel.consume('rpc', (msg) => {
    console.log(msg);

    channel.sendToQueue(msg.properties.replyTo, Buffer.from('ok'), { correlationId: msg.properties.correlationId });
  });
})();
