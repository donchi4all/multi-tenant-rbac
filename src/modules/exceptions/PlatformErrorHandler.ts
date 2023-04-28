import { ErrorInterface } from './IError';
import { ErrorHandler } from './ErrorHandler';

export class PlatformErrorHandler extends ErrorHandler {
  constructor(err: ErrorInterface) {
    super(err);
  }

  public static get DoesNotExist(): ErrorInterface {
    return {
      status: 400,
      code: 'NOT_EXIST',
      message: 'Platform does not exist',
    };
  }

  public static get AlreadyExists(): ErrorInterface {
    return {
      status: 400,
      code: 'ALREADY_EXIST',
      message: 'Platform already exists',
    };
  }

  public static get Forbidden(): ErrorInterface {
    return {
      status: 403,
      code: 'FORBIDDEN',
      message: 'Access to that platform is forbidden',
    };
  }
}
