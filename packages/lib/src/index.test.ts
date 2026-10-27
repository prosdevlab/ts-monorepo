import { describe, expect, it, vi } from 'vitest';
import { createFeature } from './index';

describe('FeatureService', () => {
  it('start() logs the feature name through the shared Logger', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    createFeature({ apiKey: 'test-key', debug: false, featureName: 'demo' }).start();
    expect(log).toHaveBeenCalledWith('[INFO] Feature demo started');
  });
});
