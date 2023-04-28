import { Role } from '../../models';
import {
  RoleInterface,
  RoleCreationType,
  RoleEditRequestType,
  RoleCreationRequestType,
} from '../../models/role/IRole';
import { UserRoleCreationType } from '../../models/user-role/IUserRole';
import { RolePermissionCreationType } from '../../models/role-permission/IRolePermission';

export interface IRoleService {
  /**
   * Creates a new role
   *
   * @param payload
   * @param tenant
   * @returns
   */
  createRole(
    tenantId: string,
    payload: RoleCreationRequestType | RoleCreationRequestType[]
  ): Promise<Array<RoleInterface>>;

  /**
   * Sudo Implementation for model findOrCreate (WIP)
   *
   * @param searchParams
   * @param payload
   * @returns
   */
  findOrCreate?(
    searchParams: Array<string>,
    payload: RoleCreationType
  ): Promise<Role>;

  /**
   * Update an existing role
   *
   * @param roleId
   * @param payload
   * @returns
   */
  updateRole(
    tenantId: string,
    roleId: RoleInterface['id'],
    payload: RoleEditRequestType
  ): Promise<Role>;

  /**
   * Fetch list of roles
   *
   * @returns
   */
  listRoles(
    tenantId: RoleInterface['tenantId']
  ): Promise<Array<Role>>;

  /**
   * Find an existing role
   *
   * @param identifier
   * @returns
   */
  findRole(
    tenantId: RoleInterface['tenantId'],
    identifier: string
  ): Promise<Role>;

  /**
   * Delete an existing role
   *
   * @param roleId
   * @returns
   */
  deleteRole(
    tenantId: RoleInterface['tenantId'],
    roleId: RoleInterface['id']
  ): Promise<void>;

  /**
   * Tenant User Role Checker
   * @param payload
   */
  tenantUserHasRole(payload: UserRoleCreationType): Promise<boolean>;

  /**
   * Role has Permission Checker
   * @param payload
   */
  roleHasPermission(payload: RolePermissionCreationType): Promise<boolean>;
}
