import { ErrorInterface } from './IError';
import { ErrorHandler } from './ErrorHandler';

export class RoleErrorHandler extends ErrorHandler {
  constructor (err: ErrorInterface) {
    super (err);
  }
  
  public static get RoleDoNotExist (): ErrorInterface {
    return {
      status: 400,
      code: 'NOT_EXIST',
      message: 'Role does not exist.',
    };
  }

  public static get Fatal (): ErrorInterface {
    return {
      status: 500,
      code: 'FATAL',
      message: 'Fatal error',
    };
  }

  public static get NotExist () : ErrorInterface {
    return {
      status: 400,
      code: 'NOT_EXIST',
      message: 'Role not found',
    };
  }

  public static get FailedToCreate (): ErrorInterface {
    return {
      status: 500,
      code: 'FAILED_TO_CREATE',
      message: 'Failed to create',
    };
  }

  public static get FailedToUpdate (): ErrorInterface {
    return {
      status: 500,
      code: 'FAILED_TO_UPDATE',
      message: 'Failed to update',
    };
  }
}
