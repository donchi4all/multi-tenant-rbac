import { ITenantService } from './ITenantService';
import {
  TenantCreationType,
  TenantInterface,
  TenantUpdatedRequestType,
} from '../../models/tenant/ITenant';
import roleService from '../../services/role';
import {
  TenantErrorHandler,
  UserRoleErrorHandler,
  CommonErrorHandler,
} from '../../modules/exceptions';
import {
  UserRoleCreationType,
  UserRoleInterface,
  UserRoleStatus,
} from '../../models/user-role/IUserRole';
import { PermissionInterface } from '../../models/permission/IPermission';
import { RoleInterface } from '../../models/role/IRole';
import { StringsFormating as Str } from '../../utils';
import Database from '../../modules/database';
import AuditTrail from '../../modules/audit';
import hooks from '../../modules/hooks';
import {
  assertArrayHasItems,
  assertNonEmptyString,
  normalizeToArray,
} from '../../modules/validation';
import TtlCache from '../../modules/cache';

export {
  TenantInterface,
  TenantCreationType,
  UserRoleCreationType,
};

export type UserHasPermissionRequest = {
  tenantId: UserRoleInterface['tenantId'];
  userId: UserRoleInterface['userId'];
  permissionId: PermissionInterface['id'] | PermissionInterface['id'][];
};

export type UserRoleResponse = {
  userId: string | undefined;
  roles: Array<Record<string, any>>;
};

export type UserPermissionResponse = {
  userId: string;
  permissions: Array<Record<string, any>>;
};

export type UserRoleSyncType = {
  tenantId: TenantInterface['id'];
  userId: UserRoleInterface['userId'];
  role: string | string[];
};

export type userHasPermission = {
  userId: UserRoleInterface['userId'];
  permission: PermissionInterface['title'];
  tenantId?: UserRoleInterface['tenantId'];
};

function uniqueById(items: Array<Record<string, any>>): Array<Record<string, any>> {
  const map = new Map<string, Record<string, any>>();
  items.forEach((item) => {
    if (!item?.id) return;
    map.set(String(item.id), item);
  });
  return [...map.values()];
}

const effectivePermissionCache = new TtlCache<Array<Record<string, any>>>(60_000);

export class TenantService implements ITenantService {
  private getTenantContext() {
    return Database.getConfig();
  }

  private getPermissionCacheKey(tenantId: string, userId: string): string {
    return `${tenantId}:${userId}`;
  }

  private invalidatePermissionCache(tenantId: string, userId: string): void {
    effectivePermissionCache.delete(this.getPermissionCacheKey(tenantId, userId));
  }

  /**
   * Resolves role -> role_permissions -> permissions and returns a normalized role payload.
   */
  private async hydrateRoleWithPermissions(role: Record<string, any>): Promise<Record<string, any>> {
    const { adapter, models, keys } = this.getTenantContext();

    const rolePermissions = await adapter.findMany(models.rolePermissions, {
      where: {
        [keys.roleId]: role.id,
      },
    });

    const permissions = await Promise.all(
      rolePermissions.map((entry) =>
        adapter.findOne(models.permissions, {
          where: {
            id: entry[keys.permissionId],
          },
        })
      )
    );

    return {
      id: role.id,
      title: role.title,
      slug: role.slug,
      isActive: role.isActive,
      description: role.description,
      permissions: permissions
        .filter(Boolean)
        .map((permission) => ({
          id: permission!.id,
          slug: permission!.slug,
          title: permission!.title,
          isActive: permission!.isActive,
          description: permission!.description,
        })),
    };
  }

  /**
   * Builds tenant role views from user_roles. Useful for user-centric tenant snapshots.
   */
  private async getRolesForTenantUsers(tenantId: string): Promise<RoleInterface[]> {
    const { adapter, models, keys } = this.getTenantContext();

    const userRoles = await adapter.findMany(models.userRoles, {
      where: {
        [keys.tenantId]: tenantId,
      },
    });

    const roles = await Promise.all(
      userRoles.map(async (userRole) => {
        const role = await adapter.findOne(models.roles, {
          where: {
            id: userRole[keys.roleId],
          },
        });

        return role ? this.hydrateRoleWithPermissions(role) : null;
      })
    );

    return roles.filter(Boolean) as RoleInterface[];
  }

  /**
   * Builds tenant role views from roles table. Useful for role-centric tenant snapshots.
   */
  private async getTenantRoleRecords(tenantId: string): Promise<RoleInterface[]> {
    const { adapter, models, keys } = this.getTenantContext();

    const roles = await adapter.findMany(models.roles, {
      where: {
        [keys.tenantId]: tenantId,
      },
    });

    const roleRecords = await Promise.all(roles.map((role) => this.hydrateRoleWithPermissions(role)));
    return roleRecords as RoleInterface[];
  }

  public async findTenant(
    value: string,
    rejectIfNotFound: boolean = true
  ): Promise<TenantInterface> {
    assertNonEmptyString(value, 'tenant value');
    const { adapter, models } = this.getTenantContext();

    try {
      const tenant =
        (await adapter.findOne(models.tenants, { where: { slug: value } })) ||
        (await adapter.findOne(models.tenants, { where: { name: value } }));

      if (!tenant && rejectIfNotFound) {
        throw new TenantErrorHandler(TenantErrorHandler.DoesNotExist);
      }

      return tenant as TenantInterface;
    } catch (err) {
      throw new TenantErrorHandler(CommonErrorHandler.Fatal);
    }
  }

  public async findTenantById(
    tenantId: TenantInterface['id'],
    rejectIfNotFound: boolean = true
  ): Promise<TenantInterface> {
    const { adapter, models } = this.getTenantContext();

    try {
      const tenant = await adapter.findOne(models.tenants, {
        where: {
          id: tenantId,
        },
      });

      if (!tenant && rejectIfNotFound) {
        throw new TenantErrorHandler(TenantErrorHandler.DoesNotExist);
      }

      return tenant as TenantInterface;
    } catch (err) {
      throw new TenantErrorHandler(CommonErrorHandler.Fatal);
    }
  }

  public async createTenant(
    tenantData: TenantCreationType,
    returnIfFound: boolean = true,
    slugCase: boolean = true
  ): Promise<TenantInterface> {
    const { adapter, models } = this.getTenantContext();
    assertNonEmptyString(tenantData.name, 'tenantData.name');

    const existingTenant = await this.findTenant(tenantData.name, false);
    if (existingTenant) {
      if (returnIfFound) return existingTenant;
      throw new TenantErrorHandler(TenantErrorHandler.AlreadyExists);
    }

    const slug = slugCase
      ? Str.toSlugCase(tenantData.name)
      : Str.toSlugCaseWithUnderscores(tenantData.name);

    const tenant = await adapter.create(models.tenants, {
      ...tenantData,
      slug,
    });

    await AuditTrail.emit({
      action: 'tenant.create',
      tenantId: String(tenant.id),
      model: models.tenants,
      recordId: String(tenant.id),
      after: tenant as Record<string, any>,
    });

    return tenant as TenantInterface;
  }

  public async deleteTenant(slug: TenantInterface['slug']): Promise<TenantInterface> {
    const { adapter, models } = this.getTenantContext();

    const tenant = await this.findTenant(slug);
    if (!tenant.isActive) {
      throw new TenantErrorHandler(TenantErrorHandler.Forbidden);
    }

    await adapter.delete(models.tenants, { id: tenant.id });
    await AuditTrail.emit({
      action: 'tenant.delete',
      tenantId: String(tenant.id),
      model: models.tenants,
      recordId: String(tenant.id),
      before: tenant as Record<string, any>,
    });
    return tenant;
  }

  public async getTenant(slug: TenantInterface['slug']): Promise<TenantInterface> {
    return await this.findTenant(slug);
  }

  public async updateTenant(
    _slug: TenantInterface['slug'],
    tenantData: TenantUpdatedRequestType
  ): Promise<TenantInterface> {
    const { adapter, models } = this.getTenantContext();

    const tenant = await this.findTenant(_slug, false);
    if (!tenant) {
      throw new TenantErrorHandler(TenantErrorHandler.DoesNotExist);
    }

    const updated = await adapter.update(models.tenants, { id: tenant.id }, tenantData);
    await AuditTrail.emit({
      action: 'tenant.update',
      tenantId: String(tenant.id),
      model: models.tenants,
      recordId: String(tenant.id),
      before: tenant as Record<string, any>,
      after: (updated || tenant) as Record<string, any>,
    });
    return (updated || tenant) as TenantInterface;
  }

  public async getUserWithRoleAndPermissions(
    tenantSlug: TenantInterface['slug']
  ): Promise<TenantInterface> {
    const tenant = await this.findTenant(tenantSlug);
    const roles = await this.getRolesForTenantUsers(String(tenant.id));

    return {
      ...tenant,
      roles,
    };
  }

  public async getTenantWithRolesAndPermissions(tenantSlug: string): Promise<TenantInterface> {
    const tenant = await this.findTenant(tenantSlug);
    const roles = await this.getTenantRoleRecords(String(tenant.id));

    return {
      ...tenant,
      roles,
    };
  }

  public async assignRoleToUser(
    userRoleData: UserRoleCreationType
  ): Promise<UserRoleInterface> {
    const { adapter, models, keys } = this.getTenantContext();
    hooks.emitHook('beforeRoleAssign', { userRoleData });
    const { userId, roleSlug, tenantId } = userRoleData;
    const tenant = await this.findTenantById(tenantId);

    const foundRole = await roleService.findRole(tenant.id, roleSlug);
    const userRole = await this.findUserRole(tenant.id, userId, foundRole.id, false);

    if (userRole) {
      throw new UserRoleErrorHandler(UserRoleErrorHandler.AlreadyExists);
    }

    try {
      const created = (await adapter.create(models.userRoles, {
        [keys.userId]: userId,
        [keys.roleId]: foundRole.id,
        status: UserRoleStatus.ACTIVE,
        [keys.tenantId]: tenant.id,
      })) as UserRoleInterface;

      hooks.emitHook('afterRoleAssign', { tenantId: tenant.id, userId, roleId: foundRole.id });
      await AuditTrail.emit({
        action: 'user.role.assign',
        tenantId: String(tenant.id),
        model: models.userRoles,
        recordId: String(created.id),
        after: created as Record<string, any>,
      });
      this.invalidatePermissionCache(String(tenant.id), String(userId));
      return created;
    } catch (err) {
      throw err;
    }
  }

  async findUserRole(
    tenantId: TenantInterface['id'],
    userId: UserRoleInterface['userId'],
    roleId: UserRoleInterface['roleId'],
    rejectIfNotFound: boolean = true
  ): Promise<UserRoleInterface> {
    const { adapter, models, keys } = this.getTenantContext();

    const tenantUserRole = await adapter.findOne(models.userRoles, {
      where: {
        [keys.tenantId]: tenantId,
        [keys.userId]: userId,
        [keys.roleId]: roleId,
      },
    });

    if (!tenantUserRole && rejectIfNotFound) {
      throw new UserRoleErrorHandler(UserRoleErrorHandler.DoesNotExist);
    }

    return tenantUserRole as UserRoleInterface;
  }

  public async getUserRole(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    rejectIfNotFound: boolean = true
  ): Promise<UserRoleResponse> {
    const { adapter, models, keys } = this.getTenantContext();
    const tenant = await this.findTenantById(tenantId);

    const tenantUserRole = await adapter.findMany(models.userRoles, {
      where: {
        [keys.tenantId]: tenant.id,
        [keys.userId]: userId,
      },
    });

    if (tenantUserRole.length === 0 && rejectIfNotFound) {
      throw new UserRoleErrorHandler(UserRoleErrorHandler.DoesNotExist);
    }

    const roles = await Promise.all(
      tenantUserRole.map(async (userRole) => {
        const role = await adapter.findOne(models.roles, {
          where: {
            id: userRole[keys.roleId],
          },
        });

        if (!role) return null;

        return {
          id: role.id,
          title: role.title,
          slug: role.slug,
          description: role.description,
        };
      })
    );

    return {
      userId: userId,
      roles: roles.filter(Boolean) as Array<Record<string, any>>,
    };
  }

  public async getUserPermissions(
    tenantId: string,
    userId: string
  ): Promise<UserPermissionResponse> {
    const { adapter, models, keys } = this.getTenantContext();

    const userRoles = await adapter.findMany(models.userRoles, {
      where: {
        [keys.tenantId]: tenantId,
        [keys.userId]: userId,
      },
    });

    if (!userRoles.length) {
      throw new Error(`User with id ${userId} not found in tenant with id ${tenantId}`);
    }

    const roleIds = uniqueById(
      userRoles
        .map((entry) => ({ id: String(entry[keys.roleId]) }))
        .filter((entry) => entry.id !== 'undefined')
    ).map((entry) => entry.id);

    const rolePermissions = await adapter.findMany(models.rolePermissions, {
      where: {
        [keys.roleId]: roleIds,
      },
    });

    const permissions = await Promise.all(
      rolePermissions.map((entry) =>
        adapter.findOne(models.permissions, {
          where: { id: entry[keys.permissionId] },
        })
      )
    );

    return {
      userId,
      permissions: uniqueById(permissions.filter(Boolean) as Array<Record<string, any>>),
    };
  }

  public async getUserRolesAndPermissions(
    tenantId: string,
    userId: string,
    rejectIfNotFound: boolean = true
  ): Promise<UserRoleResponse> {
    const { adapter, models, keys } = this.getTenantContext();

    const tenantUserRole = await adapter.findMany(models.userRoles, {
      where: {
        [keys.tenantId]: tenantId,
        [keys.userId]: userId,
      },
    });

    if (tenantUserRole.length === 0 && rejectIfNotFound) {
      throw new UserRoleErrorHandler(UserRoleErrorHandler.DoesNotExist);
    }

    const roleAndPermissions = await Promise.all(
      tenantUserRole.map(async (userRole) => {
        const role = await adapter.findOne(models.roles, {
          where: { id: userRole[keys.roleId] },
        });

        return role ? this.hydrateRoleWithPermissions(role) : null;
      })
    );

    return {
      userId: userId,
      roles: roleAndPermissions.filter(Boolean) as Array<Record<string, any>>,
    };
  }

  public async userHasPermission(payload: userHasPermission): Promise<boolean> {
    const { userId, permission, tenantId } = payload;
    const { adapter, models, keys } = this.getTenantContext();

    const matchingPermissions = await adapter.findMany(models.permissions, {
      where: { title: permission },
    });

    if (!matchingPermissions.length) return false;

    const userRoles = await adapter.findMany(models.userRoles, {
      where: {
        [keys.userId]: userId,
        ...(tenantId ? { [keys.tenantId]: tenantId } : {}),
      },
    });

    if (!userRoles.length) return false;

    const permissionIds = matchingPermissions.map((entry) => String(entry.id));
    const roleIds = userRoles.map((entry) => String(entry[keys.roleId]));

    const rolePermissions = await adapter.findMany(models.rolePermissions, {
      where: {
        [keys.roleId]: roleIds,
        [keys.permissionId]: permissionIds,
      },
    });

    return rolePermissions.length > 0;
  }

  public async syncUserWithRole(payload: UserRoleSyncType): Promise<unknown> {
    const { adapter, models, keys } = this.getTenantContext();

    const roleInput = Array.isArray(payload.role) ? payload.role : [payload.role];
    assertArrayHasItems(roleInput, 'payload.role');
    const { tenantId, userId } = payload;

    hooks.emitHook('beforeRoleSync', { tenantId, userId, roleInput });
    return Database.withTransaction(async () => {
      const tenant = await this.findTenantById(tenantId);

      await adapter.delete(models.userRoles, {
        [keys.tenantId]: tenant.id,
        [keys.userId]: userId,
      });

      const roles = await roleService.findRoles(tenant.id, roleInput);

      const records = roles.map((roleData) => ({
        [keys.userId]: userId,
        [keys.roleId]: roleData.id,
        status: UserRoleStatus.ACTIVE,
        [keys.tenantId]: tenant.id,
      }));

      const created = adapter.createMany
        ? await adapter.createMany(models.userRoles, records)
        : await Promise.all(records.map((record) => adapter.create(models.userRoles, record)));

      hooks.emitHook('afterRoleSync', { tenantId: tenant.id, userId, roles: created });
      await AuditTrail.emit({
        action: 'user.role.sync',
        tenantId: String(tenant.id),
        model: models.userRoles,
        after: { userId, roles: created as Record<string, any>[] },
      });
      this.invalidatePermissionCache(String(tenant.id), String(userId));

      return created;
    });
  }

  public async findUserByRole(
    tenantId: UserRoleInterface['tenantId'],
    roleSlug: string
  ): Promise<Array<UserRoleInterface>> {
    const { adapter, models, keys } = this.getTenantContext();
    const tenant = await this.findTenantById(tenantId);
    const role = await roleService.findRoleByName(tenant.id, roleSlug);

    const users = await adapter.findMany(models.userRoles, {
      where: {
        [keys.tenantId]: tenant.id,
        [keys.roleId]: role.id,
        status: UserRoleStatus.ACTIVE,
      },
    });

    return users as UserRoleInterface[];
  }

  public async assignRolesToUserBulk(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    roleSlugs: string[]
  ): Promise<Array<UserRoleInterface>> {
    assertArrayHasItems(roleSlugs, 'roleSlugs');
    const assignments = await Promise.all(
      roleSlugs.map((roleSlug) =>
        this.assignRoleToUser({
          tenantId,
          userId,
          roleSlug,
        })
      )
    );

    return assignments;
  }

  public async revokeRoleFromUser(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    roleSlug: string
  ): Promise<number> {
    const { adapter, models, keys } = this.getTenantContext();
    const tenant = await this.findTenantById(tenantId);
    const role = await roleService.findRole(tenant.id, roleSlug);

    const deleted = await adapter.delete(models.userRoles, {
      [keys.tenantId]: tenant.id,
      [keys.userId]: userId,
      [keys.roleId]: role.id,
    });

    if (deleted > 0) {
      await AuditTrail.emit({
        action: 'user.role.revoke',
        tenantId: String(tenant.id),
        model: models.userRoles,
        after: { userId, roleId: role.id },
      });
      this.invalidatePermissionCache(String(tenant.id), String(userId));
    }

    return deleted;
  }

  public async syncUserRoles(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    roleSlugs: string[]
  ): Promise<Array<UserRoleInterface>> {
    const result = await this.syncUserWithRole({
      tenantId: tenantId as string,
      userId: userId as string,
      role: normalizeToArray(roleSlugs),
    });

    return result as UserRoleInterface[];
  }

  public async listEffectivePermissions(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId']
  ): Promise<Array<Record<string, any>>> {
    const key = this.getPermissionCacheKey(String(tenantId), String(userId));
    const cached = effectivePermissionCache.get(key);
    if (cached) return cached;

    const userPermissions = await this.getUserPermissions(String(tenantId), String(userId));
    effectivePermissionCache.set(key, userPermissions.permissions);
    return userPermissions.permissions;
  }

  public async authorize(
    tenantId: UserRoleInterface['tenantId'],
    userId: UserRoleInterface['userId'],
    permission: string
  ): Promise<boolean> {
    return this.userHasPermission({
      tenantId,
      userId,
      permission,
    });
  }
}

const tenantService = new TenantService();
export default tenantService;
