const parser = require('../../src/tokens/api.token');
const Logger = require('../../src/utils').Logger;

describe('@api token blockValidate', () => {
  const logger = new Logger();

  describe('when with provided config.sampleRequestUrl for http', () => {
    it('should set sample request url from full endpoint', () => {
      const block = {
        api: {
          endpoint: 'http://endpoint',
          transport: {
            name: 'http',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['http://endpoint']);
    });

    it('should set sample request url from partial endpoint', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'http',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['http://localhost/endpoint']);
    });

    it('should set sample request url from partial endpoint (with slash)', () => {
      const block = {
        api: {
          endpoint: '/endpoint',
          transport: {
            name: 'http',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['http://localhost/endpoint']);
    });

    it('should set sample request url from full sample request url defined by param', () => {
      const block = {
        api: {
          transport: {
            name: 'http',
          },
        },
        sampleRequest: ['http://endpoint'],
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['http://endpoint']);
    });

    it('should set sample request url from partial sample request url defined by param', () => {
      const block = {
        api: {
          transport: {
            name: 'http',
          },
        },
        sampleRequest: ['endpoint'],
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['http://localhost/endpoint']);
    });

    it('should set sample request url from partial sample request url defined by param (with slash)', () => {
      const block = {
        api: {
          transport: {
            name: 'http',
          },
        },
        sampleRequest: ['/endpoint'],
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['http://localhost/endpoint']);
    });

    it('should set sample request proxy', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'http',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (http)', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'http',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyHttp: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyHttp);
    });
  });

  describe('when with provided config.sampleRequestUrl for https', () => {
    it('should set sample request url from full endpoint', () => {
      const block = {
        api: {
          endpoint: 'https://endpoint',
          transport: {
            name: 'https',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['https://endpoint']);
    });

    it('should set sample request url from partial endpoint', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'https',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['https://localhost/endpoint']);
    });

    it('should set sample request url from partial endpoint (with slash)', () => {
      const block = {
        api: {
          endpoint: '/endpoint',
          transport: {
            name: 'https',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['https://localhost/endpoint']);
    });

    it('should set sample request url from full sample request url defined by param', () => {
      const block = {
        api: {
          transport: {
            name: 'https',
          },
        },
        sampleRequest: ['https://endpoint'],
      };
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['https://endpoint']);
    });

    it('should set sample request url from partial sample request url defined by param', () => {
      const block = {
        api: {
          transport: {
            name: 'https',
          },
        },
        sampleRequest: ['endpoint'],
      };
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['https://localhost/endpoint']);
    });

    it('should set sample request url from partial sample request url defined by param (with slash)', () => {
      const block = {
        api: {
          transport: {
            name: 'https',
          },
        },
        sampleRequest: ['/endpoint'],
      };
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['https://localhost/endpoint']);
    });

    it('should set sample request proxy', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'https',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'https://localhost',
        sampleRequestProxy: 'https://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (https)', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'https',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyHttp: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyHttp);
    });
  });

  describe('when with provided config.sampleRequestUrl for nats', () => {
    it('should set sample request proxy', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'nats',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (sampleRequestProxyNats)', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'nats',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyNats: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyNats);
    });
  });

  describe('when with provided config.sampleRequestUrl for nats rpc', () => {
    it('should set sample request proxy', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'natsrpc',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (sampleRequestProxyNats)', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'natsrpc',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyNats: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyNats);
    });
  });

  describe('when with provided config.sampleRequestUrl for rabbitmq', () => {
    it('should set sample request proxy', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'rabbitmq',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (sampleRequestProxyRabbitmq)', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'rabbitmq',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyNats: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyRabbitmq);
    });
  });

  describe('when with provided config.sampleRequestUrl for rabbitmq rpc', () => {
    it('should set sample request proxy', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'rabbitmqrpc',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxy);
    });

    it('should set sample request proxy (sampleRequestProxyRabbitmq)', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'rabbitmqrpc',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyNats: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe(config.sampleRequestProxyRabbitmq);
    });
  });

  describe('when with provided config.sampleRequestUrl for websocket', () => {
    it('should set sample request url from full endpoint', () => {
      const block = {
        api: {
          endpoint: 'ws://endpoint',
          transport: {
            name: 'ws',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['ws://endpoint']);
    });

    it('should set sample request url from partial endpoint', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'ws',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['ws://localhost/endpoint']);
    });

    it('should set sample request url from partial endpoint (with slash)', () => {
      const block = {
        api: {
          endpoint: '/endpoint',
          transport: {
            name: 'ws',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['ws://localhost/endpoint']);
    });

    it('should set sample request url from full sample request url defined by param', () => {
      const block = {
        api: {
          transport: {
            name: 'ws',
          },
        },
        sampleRequest: ['ws://endpoint'],
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['ws://endpoint']);
    });

    it('should set sample request url from partial sample request url defined by param', () => {
      const block = {
        api: {
          transport: {
            name: 'ws',
          },
        },
        sampleRequest: ['endpoint'],
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['ws://localhost/endpoint']);
    });

    it('should set sample request url from partial sample request url defined by param (with slash)', () => {
      const block = {
        api: {
          transport: {
            name: 'ws',
          },
        },
        sampleRequest: ['/endpoint'],
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequest).toEqual(['ws://localhost/endpoint']);
    });

    it('should set sample request proxy', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'ws',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxy: 'http://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe('ws://proxy');
    });

    it('should set sample request proxy (sampleRequestProxyWs)', () => {
      const block = {
        api: {
          endpoint: 'endpoint',
          transport: {
            name: 'websocket',
          },
        },
      };
      const config = {
        logger,
        sampleRequestUrl: 'http://localhost',
        sampleRequestProxyWs: 'ws://proxy',
      };
  
      parser.blockValidate(block, config);
  
      expect(block.sampleRequestProxy).toBe('ws://proxy');
    });
  });
});
