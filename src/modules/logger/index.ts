import { Logger as WinstonLogger } from './Logger';

/**
 * Parameter logger decorator
 * @param scope - Logger label or file | dir path
 */
// export function LoggerDecorator (scope: string): PropertyDecorator {
//   return (target: Record<string, unknown>, propertyKey: string): void => {
//     const logger = new WinstonLogger(scope);
//     target[propertyKey] = logger;
//   };
// }


export function LoggerDecorator(scope: string): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol): void {
    const logger = new WinstonLogger(scope);
    Object.defineProperty(target, propertyKey, {
      configurable: true,
      enumerable: false,
      get() {
        return logger;
      },
    });
  };
}

export { Logger } from './Logger';

export { LoggerInterface } from './ILogger';