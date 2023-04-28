import path from 'path';
import winston from 'winston';

/**
 * This is the main Logger Object.
 * A scope logger can be extended or can be used directly as the static log methods.
 */

export class Logger {
  public static DEFAULT_SCOPE = 'app';
  public static LOG_DIR = 'logs';

  private scope: string;
  private logger: winston.Logger;

  private static parsePathToScope (filepath: string): string {
    if (filepath.indexOf(path.sep) >= 0) {
      filepath = filepath
        .replace(process.cwd(), '')
        .replace(`${path.sep}src${path.sep}`, '')
        .replace(`${path.sep}dist${path.sep}`, '')
        .replace('.ts', '')
        .replace('.js', '')
        .replace(path.sep, ':');
    }
    return filepath;
  }

  /**
   * Constructor
   * @param scope - Logger label or file|dir path
   */
  constructor (scope?: string) {
    this.scope = Logger.parsePathToScope(scope || Logger.DEFAULT_SCOPE);

    const loggerFormat = winston.format.printf(({ level, message, label, timestamp }) => {
      return `${timestamp} [${label}] ${level}: ${message}`;
    });

    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.label({ label: this.scope }),
        winston.format.timestamp(),
        loggerFormat,
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          dirname: Logger.LOG_DIR,
          filename: `${this.scope}.log`,
        })
      ]
    });
  }

  /**
   * Internal wrapper function for Winston Logger
   * @param level - Winston logger level: 'debug' | 'info' | 'warn' | 'error'
   * @param message - Logging message
   * @param args - Additional arguments
   */
  private log (level: 'debug' | 'info' | 'warn' | 'error', message: string, args: unknown[]): void {
    this.logger[level](`${message}`, args);
  }

  /**
   * Used for logging debug process
   * @param message - Logging message
   * @param args - Additional arguments
   */
  public debug (message: string, ...args: unknown[]): void {
    this.log('debug', message, args);
  }

  /**
   * Used for logging info data
   * @param message - Logging message
   * @param args - Additional arguments
   */
  public info (message: string, ...args: unknown[]): void {
    this.log('info', message, args);
  }

  /**
   * Used for logging a warning
   * @param message - Logging message
   * @param args - Additional arguments
   */
  public warn (message: string, ...args: unknown[]): void {
    this.log('warn', message, args);
  }

  /**
   * Used for logging an error
   * @param message - Logging message
   * @param args - Additional arguments
   */
  public error (message: string, ...args: unknown[]): void {
    this.log('error', message, args);
  }
}