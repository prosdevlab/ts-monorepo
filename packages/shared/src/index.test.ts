import { describe, expect, it } from 'vitest';
import { CoreService, createCoreService, createLogger } from './index';

describe('CoreService', () => {
  it('should create a CoreService instance', () => {
    const service = new CoreService({ apiKey: 'test-key', debug: false });
    expect(service).toBeInstanceOf(CoreService);
  });

  it('should return the API key', () => {
    const service = new CoreService({ apiKey: 'test-key', debug: false });
    expect(service.getApiKey()).toBe('test-key');
  });

  it('should create a CoreService via factory function', () => {
    const service = createCoreService({ apiKey: 'factory-key', debug: true });
    expect(service).toBeInstanceOf(CoreService);
    expect(service.getApiKey()).toBe('factory-key');
  });
});

describe('Logger', () => {
  it('Logger reports which API key its service uses', () => {
    const logger = createLogger(createCoreService({ apiKey: 'test-key', debug: false }), {
      level: 'info',
    });
    expect(logger.getServiceInfo()).toBe('Logger using API Key: test-key');
  });
});
