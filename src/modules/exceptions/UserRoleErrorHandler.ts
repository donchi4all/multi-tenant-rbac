import { ErrorInterface } from './IError';
import { ErrorHandler } from './ErrorHandler';

export class UserRoleErrorHandler extends ErrorHandler {
  constructor(err: ErrorInterface) {
    super(err);
  }

  public static get DoesNotExist(): ErrorInterface {
    return {
      status: 400,
      code: 'NOT_EXIST',
      message: 'User with this role does not exist',
    };
  }

  public static get AlreadyExists(): ErrorInterface {
    return {
      status: 400,
      code: 'ALREADY_EXIST',
      message: 'User already has this role',
    };
  }

  public static get Forbidden(): ErrorInterface {
    return {
      status: 403,
      code: 'FORBIDDEN',
      message: 'User Access to this role is forbidden',
    };
  }

}
