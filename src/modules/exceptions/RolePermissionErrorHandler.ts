import { ErrorInterface } from './IError';
import { ErrorHandler } from './ErrorHandler';

export class RolePermissionErrorHandler extends ErrorHandler {
  constructor(err: ErrorInterface) {
    super(err);
  }

  public static get DoesNotExist(): ErrorInterface {
    return {
      status: 400,
      code: 'NOT_EXIST',
      message: 'Role with this Permission does not exist',
    };
  }

  public static get AlreadyExists(): ErrorInterface {
    return {
      status: 400,
      code: 'ALREADY_EXIST',
      message: 'Role already have this permission',
    };
  }

  public static get Forbidden(): ErrorInterface {
    return {
      status: 403,
      code: 'FORBIDDEN',
      message: 'Role Access to this permission is forbidden',
    };
  }

}
