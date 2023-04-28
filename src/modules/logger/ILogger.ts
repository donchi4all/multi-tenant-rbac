export interface LoggerInterface {
  debug (message: string, ...args: unknown[]): void;
  info  (message: string, ...args: unknown[]): void;
  warn  (message: string, ...args: unknown[]): void;
  error (message: string, ...args: unknown[]): void;
}