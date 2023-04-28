import { ErrorInterface } from './IError';
import { ErrorHandler } from './ErrorHandler';

export class TenantErrorHandler extends ErrorHandler {
  constructor(err: ErrorInterface) {
    super(err);
  }

  public static get DoesNotExist(): ErrorInterface {
    return {
      status: 400,
      code: 'NOT_EXIST',
      message: 'Business does not exist',
    };
  }

  public static get AlreadyExists(): ErrorInterface {
    return {
      status: 400,
      code: 'ALREADY_EXIST',
      message: 'Business already exists',
    };
  }

  public static get Forbidden(): ErrorInterface {
    return {
      status: 403,
      code: 'FORBIDDEN',
      message: 'Access to that business is forbidden',
    };
  }

}
