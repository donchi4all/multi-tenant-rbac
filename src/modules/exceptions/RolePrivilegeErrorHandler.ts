import { ErrorInterface } from './IError';
import { ErrorHandler } from './ErrorHandler';

export class RolePrivilegeErrorHandler extends ErrorHandler {
  constructor (err: ErrorInterface) {
    super (err);
  }
  
  public static get RoleDoesNotExist (): ErrorInterface {
    return {
      status: 400,
      code: 'NOT_EXIST',
      message: 'The role does not exist.',
    };
  }

  public static get GrantDoesNotExist (): ErrorInterface {
    return {
      status: 400,
      code: 'NOT_EXIST',
      message: 'The grant does not exist.',
    };
  }

  public static get PermissionsDoNotExist (): ErrorInterface {
    return {
      status: 400,
      code: 'NOT_EXIST',
      message: 'Permissions have not been found.',
    };
  }

  public static get RolePrivilegesDoNotExist (): ErrorInterface {
    return {
      status: 400,
      code: 'NOT_EXIST',
      message: 'Role privileges have not been found.',
    };
  }

  public static get RoleAlreadyExists (): ErrorInterface {
    return {
      status: 400,
      code: 'ALREADY_EXISTS',
      message: 'The role already exists.',
    };
  }

  public static get InactiveRole (): ErrorInterface {
    return {
      status: 400,
      code: 'FAILED_TO_GET',
      message: 'The role is inactive.',
    };
  }

  public static get Fatal (): ErrorInterface {
    return {
      status: 500,
      code: 'FATAL',
      message: 'Fatal error',
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
