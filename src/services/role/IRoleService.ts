import {
  RoleInterface,
  RoleCreationType,
  RoleEditRequestType,
  RoleCreationRequestType,
} from '../../models/role/IRole';
import { UserRoleRequestType } from '../../models/user-role/IUserRole';
import {
  RolePermissionCreationType,
  RolePermissionInterface,
} from '../../models/role-permission/IRolePermission';

export interface IRoleService {
  /** Create role(s) for a tenant identified by slug/name. */
  createRole(
    tenantSlug: string,
    payload: RoleCreationRequestType | RoleCreationRequestType[],
    slugCase?: boolean
  ): Promise<Array<RoleInterface>>;

  /** Find one role by arbitrary fields or create when missing. */
  findOrCreateRole?(
    searchParams: Array<string>,
    payload: RoleCreationType
  ): Promise<RoleInterface>;

  /** Update a role in a tenant context. */
  updateRole(
    tenantId: string,
    roleId: RoleInterface['id'],
    payload: RoleEditRequestType,
    slugCase?: boolean
  ): Promise<RoleInterface>;

  /** List roles for a tenant. */
  listRoles(tenantId: RoleInterface['tenantId']): Promise<Array<RoleInterface>>;

  /** Find role by slug/title in a tenant context. */
  findRole(
    tenantId: RoleInterface['tenantId'],
    identifier: string
  ): Promise<RoleInterface>;

  /** Delete role by id in tenant context. */
  deleteRole(
    tenantId: RoleInterface['tenantId'],
    roleId: RoleInterface['id']
  ): Promise<void>;

  /** Check if user has a role inside a tenant. */
  userHasRole(payload: UserRoleRequestType): Promise<boolean>;

  /** Check if role has permission relation. */
  roleHasPermission(payload: RolePermissionCreationType): Promise<boolean>;

  /** Upsert a single role by title/slug in tenant scope. */
  upsertRole(
    tenantSlug: string,
    payload: RoleCreationRequestType,
    slugCase?: boolean
  ): Promise<RoleInterface>;

  /** Grant permission(s) to role in tenant scope. */
  grantPermissionsToRole(
    tenantId: RoleInterface['tenantId'],
    role: string,
    permissions: string[]
  ): Promise<Array<RolePermissionInterface>>;

  /** Revoke permission(s) from role in tenant scope. */
  revokePermissionsFromRole(
    tenantId: RoleInterface['tenantId'],
    role: string,
    permissions: string[]
  ): Promise<number>;
}
