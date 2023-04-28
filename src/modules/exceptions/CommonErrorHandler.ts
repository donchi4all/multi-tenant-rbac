import { ErrorInterface } from './IError';
import { ErrorHandler } from './ErrorHandler';

export class CommonErrorHandler extends ErrorHandler {
  constructor (err: ErrorInterface) {
    super (err);
  }
  
  public static get NotExist () : ErrorInterface {
    return {
      status: 400,
      code: 'NOT_EXIST',
      message: 'Not Exist',
    };
  }

  public static get AlreadyExists () : ErrorInterface {
    return {
      status: 400,
      code: 'ALREADY_EXISTS',
      message: 'Already exists',
    };
  }

  public static get Fatal () : ErrorInterface {
    return {
      status: 500,
      code: 'FATAL',
      message: 'Fatal error',
    };
  }

  public static get FailedToCreate () : ErrorInterface {
    return {
      status: 500,
      code: 'FAILED_TO_CREATE',
      message: 'Failed to create',
    };
  }

  public static get FailedToUpdate () : ErrorInterface {
    return {
      status: 500,
      code: 'FAILED_TO_UPDATE',
      message: 'Failed to update',
    };
  }
}
