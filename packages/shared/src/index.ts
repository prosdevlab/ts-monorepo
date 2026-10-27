export interface CoreConfig {
  apiKey: string;
  debug: boolean;
}

export class CoreService {
  private config: CoreConfig;

  constructor(config: CoreConfig) {
    this.config = config;
  }

  initialize(): void {
    if (this.config.debug) {
      console.log('CoreService initialized with config:', this.config);
    }
  }

  getApiKey(): string {
    return this.config.apiKey;
  }
}

export function createCoreService(config: CoreConfig): CoreService {
  return new CoreService(config);
}

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
}

export class Logger {
  private level: string;
  private coreService: CoreService;

  constructor(coreService: CoreService, config: LoggerConfig) {
    this.coreService = coreService;
    this.level = config.level;
  }

  log(message: string): void {
    console.log(`[${this.level.toUpperCase()}] ${message}`);
  }

  getServiceInfo(): string {
    return `Logger using API Key: ${this.coreService.getApiKey()}`;
  }
}

export function createLogger(coreService: CoreService, config: LoggerConfig): Logger {
  return new Logger(coreService, config);
}
