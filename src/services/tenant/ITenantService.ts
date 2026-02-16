import {
  TenantCreationType,
  TenantInterface,
  TenantUpdatedRequestType,
} from '../../models/tenant/ITenant';
import {
  UserRoleCreationType,
  UserRoleInterface,
} from '../../models/user-role/IUserRole';
import { userHasPermission, UserRoleResponse } from './index';

export interface ITenantService {
  /** Create a tenant (existing behavior preserved). */
  createTenant(
    tenantData: TenantCreationType | TenantCreationType[]
  ): Promise<TenantInterface>;

  /** Fetch tenant by slug. */
  getTenant(_slug: TenantInterface['slug']): Promise<TenantInterface>;

  /** Delete tenant by slug. */
  deleteTenant(_slug: TenantInterface['slug']): Promise<TenantInterface>;

  /** Update tenant data by slug. */
  updateTenant(
    _slug: TenantInterface['slug'],
    tenantData: TenantUpdatedRequestType
  ): Promise<TenantInterface>;

  /** List tenant roles with permissions. */
  getTenantWithRolesAndPermissions(_slug: TenantInterface['slug']): Promise<unknown>;

  /** Assign one role to a tenant user. */
  assignRoleToUser(tenantUserRoleData: UserRoleCreationType): Promise<UserRoleInterface>;

  /** Find a tenant user-role relation. */
  findUserRole(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    roleId: UserRoleInterface['roleId']
  ): Promise<UserRoleInterface>;

  /** Get user roles within a tenant. */
  getUserRole(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    rejectIfNotFound: boolean
  ): Promise<UserRoleResponse>;

  /** Check if user has permission via assigned roles. */
  userHasPermission(payload: userHasPermission): Promise<boolean>;

  /** Find users by role slug in a tenant. */
  findUserByRole(
    tenantId: UserRoleInterface['tenantId'],
    roleSlug: string
  ): Promise<Array<UserRoleInterface>>;

  /** Assign multiple roles to a user. */
  assignRolesToUserBulk(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    roleSlugs: string[]
  ): Promise<Array<UserRoleInterface>>;

  /** Revoke a user role assignment. */
  revokeRoleFromUser(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    roleSlug: string
  ): Promise<number>;

  /** Idempotently replace all roles for a user. */
  syncUserRoles(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    roleSlugs: string[]
  ): Promise<Array<UserRoleInterface>>;

  /** List flattened effective permissions for a tenant user. */
  listEffectivePermissions(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId']
  ): Promise<Array<Record<string, any>>>;

  /** Authorize a user for permission in a tenant context. */
  authorize(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    permission: string
  ): Promise<boolean>;
}
