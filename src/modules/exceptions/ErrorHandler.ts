import { ErrorInterface } from './IError';

export class ErrorHandler extends Error {
  public status: number;
  public code: string;

  constructor (err: ErrorInterface) {
    super(err.message);
    this.status = err.status;
    this.name = this.constructor.name;
    this.code = err.code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
