module.exports = {
  allowPresets: true,
  amqp: {
    allow: true,
    allowHeaders: [
      'X-Request-Id',
      'correlationId',
      'User-Agent',
    ],
    default: 'amqp://username:password@ip:5672/virtualHost',
  },
  http: {
    allow: true,
    allowHeaders: [
      'Authorization',
      'Content-Type',
      'User-Agent',
    ],
    proxyPort: 8088,
  },
  webSocket: {
    allow: true,
    default: 'ws://ip:9999',
    proxyPort: 8089,
  },
};
