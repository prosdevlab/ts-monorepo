import { type CoreConfig, CoreService, createLogger, type Logger } from '@monorepo/shared';

export interface FeatureConfig extends CoreConfig {
  featureName: string;
}

export class FeatureService {
  private coreService: CoreService;
  private logger: Logger;
  private name: string;

  constructor(config: FeatureConfig) {
    this.coreService = new CoreService(config);
    this.logger = createLogger(this.coreService, { level: 'info' });
    this.name = config.featureName;
  }

  start(): void {
    this.coreService.initialize();
    this.logger.log(`Feature ${this.name} started`);
    this.logger.log(this.logger.getServiceInfo());
  }
}

export function createFeature(config: FeatureConfig): FeatureService {
  return new FeatureService(config);
}
