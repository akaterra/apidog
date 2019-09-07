module.exports = {
  allowPresets: true,
  presetsDir: "presets",

  http: {
    allow: true,
    allowHeaders: [
      'Authorization',
      'Content-Type',
      'User-Agent',
    ],
    proxyPort: 8088,
  },

  nats: {
    allow: true,
    default: 'nats://username:password@ip:4222'
  },

  rabbitmq: {
    allow: true,
    allowHeaders: [
      'X-Request-Id',
      'correlationId',
      'User-Agent',
    ],
    default: 'amqp://username:password@ip:5672/virtualHost',
    drivers: {
      rpc: 'amqplibRpc',
    },
  },

  websocket: {
    allow: true,
    default: 'ws://ip:9999',
    proxyPort: 8089,
  },
};
