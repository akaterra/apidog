module.exports = {
  allowPresets: true,
  presetsDir: "presets",
  serveApidoc: '../apidoc',

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

  redis: {
    allow: true,
    default: 'redis://password@ip:6379'
  },

  websocket: {
    allow: true,
    default: 'ws://ip:9999',
    proxyPort: 8089,
  },
};
