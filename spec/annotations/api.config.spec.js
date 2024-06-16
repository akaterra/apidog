const parser = require('../../src/annotations/api');
const {Block} = require('../../src/block');
const Logger = require('../../src/utils').Logger;

describe('@api annotation', () => {
  const logger = new Logger();

  describe('when used with provided config.sampleRequestUrl for http', () => {
    it('should set sample request url from full endpoint', () => {
      const block = new Block({
        api: {
          endpoint: 'http://endpoint',
          transport: {
            name: 'http',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['http://endpoint']);
    });

    it('should set sample request url from partial endpoint', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'http',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['http://localhost/endpoint']);
    });

    it('should set sample request url from partial endpoint (with slash)', () => {
      const block = new Block({
        api: {
          endpoint: '/endpoint',
          transport: {
            name: 'http',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['http://localhost/endpoint']);
    });

    it('should set sample request url from full sample request url defined by param', () => {
      const block = new Block({
        api: {
          transport: {
            name: 'http',
          },
        },
        sampleRequest: ['http://endpoint'],
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['http://endpoint']);
    });

    it('should set sample request url from partial sample request url defined by param', () => {
      const block = new Block({
        api: {
          transport: {
            name: 'http',
          },
        },
        sampleRequest: ['endpoint'],
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['http://localhost/endpoint']);
    });

    it('should set sample request url from partial sample request url defined by param (with slash)', () => {
      const block = new Block({
        api: {
          transport: {
            name: 'http',
          },
        },
        sampleRequest: ['/endpoint'],
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['http://localhost/endpoint']);
    });

    it('should set sample request proxy', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'http',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (http)', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'http',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyHttp: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyHttp);
    });
  });

  describe('when used with provided config.sampleRequestUrl for https', () => {
    it('should set sample request url from full endpoint', () => {
      const block = new Block({
        api: {
          endpoint: 'https://endpoint',
          transport: {
            name: 'https',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['https://endpoint']);
    });

    it('should set sample request url from partial endpoint', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'https',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['https://localhost/endpoint']);
    });

    it('should set sample request url from partial endpoint (with slash)', () => {
      const block = new Block({
        api: {
          endpoint: '/endpoint',
          transport: {
            name: 'https',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['https://localhost/endpoint']);
    });

    it('should set sample request url from full sample request url defined by param', () => {
      const block = new Block({
        api: {
          transport: {
            name: 'https',
          },
        },
        sampleRequest: ['https://endpoint'],
      });
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['https://endpoint']);
    });

    it('should set sample request url from partial sample request url defined by param', () => {
      const block = new Block({
        api: {
          transport: {
            name: 'https',
          },
        },
        sampleRequest: ['endpoint'],
      });
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['https://localhost/endpoint']);
    });

    it('should set sample request url from partial sample request url defined by param (with slash)', () => {
      const block = new Block({
        api: {
          transport: {
            name: 'https',
          },
        },
        sampleRequest: ['/endpoint'],
      });
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['https://localhost/endpoint']);
    });

    it('should set sample request proxy', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'https',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (https)', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'https',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyHttp: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyHttp);
    });
  });

  describe('when used with provided config.sampleRequestUrl for nats pub', () => {
    it('should set sample request proxy', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'natspub',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (sampleRequestProxyNats)', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'natspub',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyNatsPub: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyNatsPub);
    });
  });

  describe('when used with provided config.sampleRequestUrl for nats rpc', () => {
    it('should set sample request proxy', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'natsrpc',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (sampleRequestProxyNatsPub)', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'natsrpc',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyNatsPub: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyNatsPub);
    });
  });

  describe('when used with provided config.sampleRequestUrl for rabbitmq pub', () => {
    it('should set sample request proxy', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'rabbitmqpub',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (sampleRequestProxyRabbitmq)', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'rabbitmqpub',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyNats: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyRabbitmq);
    });
  });

  describe('when used with provided config.sampleRequestUrl for redis pub', () => {
    it('should set sample request proxy', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'redispub',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (sampleRequestProxyRedis)', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'redispub',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyRedisPub: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyRedisPub);
    });
  });

  describe('when used with provided config.sampleRequestUrl for redis sub', () => {
    it('should set sample request proxy', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'redissub',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyRedisSub: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyRedisSub);
    });

    it('should set sample request proxy (sampleRequestProxyRedisPub)', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'redissub',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyRedisPub: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyRedis);
    });
  });

  describe('when used with provided config.sampleRequestUrl for rabbitmq rpc', () => {
    it('should set sample request proxy', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'rabbitmqrpc',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (sampleRequestProxyRabbitmq)', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'rabbitmqrpc',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyNats: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyRabbitmq);
    });
  });

  describe('when used with provided config.sampleRequestUrlWs for websocket', () => {
    it('should set sample request url from full endpoint', () => {
      const block = new Block({
        api: {
          endpoint: 'ws://endpoint',
          transport: {
            name: 'ws',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrlWs: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['ws://endpoint']);
    });

    it('should set sample request url from partial endpoint', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'ws',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrlWs: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['ws://localhost/endpoint']);
    });

    it('should set sample request url from partial endpoint (with slash)', () => {
      const block = new Block({
        api: {
          endpoint: '/endpoint',
          transport: {
            name: 'ws',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrlWs: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['ws://localhost/endpoint']);
    });

    it('should set sample request url from full sample request url defined by param', () => {
      const block = new Block({
        api: {
          transport: {
            name: 'ws',
          },
        },
        sampleRequest: ['ws://endpoint'],
      });
      const config = {
        logger,
        sampleRequestUrlWs: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['ws://endpoint']);
    });

    it('should set sample request url from partial sample request url defined by param', () => {
      const block = new Block({
        api: {
          transport: {
            name: 'ws',
          },
        },
        sampleRequest: ['endpoint'],
      });
      const config = {
        logger,
        sampleRequestUrlWs: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['ws://localhost/endpoint']);
    });

    it('should set sample request url from partial sample request url defined by param (with slash)', () => {
      const block = new Block({
        api: {
          transport: {
            name: 'ws',
          },
        },
        sampleRequest: ['/endpoint'],
      });
      const config = {
        logger,
        sampleRequestUrlWs: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequest).toEqual(['ws://localhost/endpoint']);
    });

    it('should set sample request proxy', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'ws',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrlWs: 'http://localhost',
        sampleRequestProxyWs: 'ws://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe('ws://proxy');
    });

    it('should set sample request proxy (sampleRequestProxyWs)', () => {
      const block = new Block({
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'websocket',
          },
        },
      });
      const config = {
        logger,
        sampleRequestUrlWs: 'http://localhost',
        sampleRequestProxyWs: 'ws://proxy',
      };
  
      parser.validate(block, config);
  
      expect(block.sampleRequestProxy).toBe('ws://proxy');
    });
  });
});
