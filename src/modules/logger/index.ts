import { Logger as WinstonLogger } from './Logger';

/**
 * Parameter logger decorator
 * @param scope - Logger label or file | dir path
 */
export function LoggerDecorator (scope: string): PropertyDecorator {
  return (target: Record<string, unknown>, propertyKey: string): void => {
    const logger = new WinstonLogger(scope);
    target[propertyKey] = logger;
  };
}

export { Logger } from './Logger';

export { LoggerInterface } from './ILogger';