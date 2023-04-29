import {
  TenantCreationType,
  TenantInterface,
  TenantUpdatedRequestType,
} from '../../models/tenant/ITenant';
import {
  UserRoleCreationType,
  UserRoleInterface,
} from '../../models/user-role/IUserRole';
import { UserRole } from '../../models';
import { userHasPermission, UserRoleResponse } from './index';

export interface ITenantService {
  /**
   * Create Tenant in a platform
   * @param tenantData
   */
  createTenant(
    tenantData: TenantCreationType | TenantCreationType[],
  ): Promise<TenantInterface>;

  /**
   * Find Tenant in a platform
   * @param _slug
   */
  getTenant(
    _slug: TenantInterface['slug'],
  ): Promise<TenantInterface>;


  /**
   *
   * @param _slug
   */
  deleteTenant(
    _slug: TenantInterface['slug'],
  ): Promise<TenantInterface>;

  /**
   * update tenant data
   * @param tenantData
   * @param _slug
   */
  updateTenant(
    _slug: TenantInterface['slug'],
    tenantData: TenantUpdatedRequestType
  ): Promise<TenantInterface>;

  /**
   * Get Tenant Roles and Permission
   * @param _slug
   */
  getTenantWithRoleAndPermissions(
    _slug: TenantInterface['slug']
  ): Promise<unknown>;

  /**
   * Assign role with Tenant User
   *
   * @param platformSlug
   * @param _slug
   */
  assignRoleToUser(
    tenantUserRoleData: UserRoleCreationType
  ): Promise<UserRoleInterface>;

  /**
   * Finds an existing tenant user record
   *
   * @param tenantId
   * @param userId
   * @param roleId
   */
  findUserRole(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    roleId: UserRoleInterface['roleId']
  ): Promise<UserRole>;

  /**
   * Get tenant user role and permission
   * @param tenantId
   * @param userId
   * @param rejectIfNotFound
   */
  getUserRole(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    rejectIfNotFound: boolean
  ): Promise<UserRoleResponse>;

  /**
   * Get tenant user has permissions
   * @param userId
   * @param permission
   */
  userHasPermission(payload: userHasPermission): Promise<boolean>;

  /**
   * Find tenantUsers with Role
   * @param tenantId
   * @param roleSlug
   */
  findUserByRole(
    tenantId: UserRoleInterface['tenantId'],
    roleSlug: string
  ): Promise<Array<UserRoleInterface>>;
}
