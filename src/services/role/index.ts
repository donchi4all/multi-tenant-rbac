import {
  RoleCreationRequestType,
  RoleCreationType,
  RoleEditRequestType,
  RoleInterface,
} from '../../models/role/IRole';
import { IRoleService } from './IRoleService';
import {
  TenantErrorHandler,
  CommonErrorHandler,
  RoleErrorHandler,
  RolePermissionErrorHandler,
} from '../../modules/exceptions';
import {
  AddPermissionToRoleType,
  RolePermissionCreationType,
  RolePermissionInterface,
} from '../../models/role-permission/IRolePermission';
import { UserRoleRequestType } from '../../models/user-role/IUserRole';
import { StringsFormating as Str } from '../../utils';
import Database from '../../modules/database';
import AuditTrail from '../../modules/audit';
import hooks from '../../modules/hooks';
import {
  assertArrayHasItems,
  assertNonEmptyString,
  normalizeToArray,
} from '../../modules/validation';

export { RolePermissionInterface };

function uniq(values: string[]): string[] {
  return [...new Set(values)];
}

export class RoleService implements IRoleService {
  private getRoleContext() {
    return Database.getConfig();
  }

  private async findTenantBySlugOrName(tenantSlug: string): Promise<Record<string, any> | null> {
    const { adapter, models } = this.getRoleContext();

    return (
      (await adapter.findOne(models.tenants, { where: { slug: tenantSlug } })) ||
      (await adapter.findOne(models.tenants, { where: { name: tenantSlug } }))
    );
  }

  /**
   * Tries slug first, then title. Keeps lookups deterministic and cache-friendly.
   */
  private async findRoleByIdentifier(
    tenantId: RoleInterface['tenantId'],
    identifier: string
  ): Promise<RoleInterface | null> {
    const { adapter, models, keys } = this.getRoleContext();

    const bySlug = await adapter.findOne(models.roles, {
      where: {
        slug: identifier,
        [keys.tenantId]: tenantId,
      },
    });

    if (bySlug) return bySlug as RoleInterface;

    const byTitle = await adapter.findOne(models.roles, {
      where: {
        title: identifier,
        [keys.tenantId]: tenantId,
      },
    });

    return (byTitle as RoleInterface) || null;
  }

  private async findPermissionIdsByIdentifiers(identifiers: string[]): Promise<string[]> {
    const { adapter, models } = this.getRoleContext();

    const [bySlug, byTitle] = await Promise.all([
      adapter.findMany(models.permissions, { where: { slug: identifiers } }),
      adapter.findMany(models.permissions, { where: { title: identifiers } }),
    ]);

    return uniq([...bySlug, ...byTitle].map((item) => String(item.id)));
  }

  public async createRole(
    tenantSlug: string,
    payload: RoleCreationRequestType | RoleCreationRequestType[],
    slugCase: boolean = true
  ): Promise<RoleInterface[]> {
    assertNonEmptyString(tenantSlug, 'tenantSlug');
    const { adapter, models, keys } = this.getRoleContext();
    const tenant = await this.findTenantBySlugOrName(tenantSlug);

    if (!tenant) {
      throw new TenantErrorHandler(TenantErrorHandler.DoesNotExist);
    }

    const tenantId = tenant.id;
    const items = Array.isArray(payload) ? payload : [payload];
    assertArrayHasItems(items, 'payload');

    const roles = await Promise.all(
      items.map(async ({ description, isActive, title }) => {
        assertNonEmptyString(title, 'role.title');
        const slug = slugCase
          ? Str.toSlugCase(title)
          : Str.toSlugCaseWithUnderscores(title);

        const existing = await adapter.findOne(models.roles, {
          where: {
            [keys.tenantId]: tenantId,
            slug,
            title,
          },
        });

        if (existing) {
          return existing as RoleInterface;
        }

        return (await adapter.create(models.roles, {
          title,
          slug,
          description,
          isActive,
          [keys.tenantId]: tenantId,
        })) as RoleInterface;
      })
    );

    await Promise.all(
      roles.map((role) =>
        AuditTrail.emit({
          action: 'role.create',
          tenantId: String(tenantId),
          model: models.roles,
          recordId: String(role.id),
          after: role,
        })
      )
    );

    return roles;
  }

  public async findOrCreateRole(
    searchParams: Array<string>,
    payload: RoleCreationType
  ): Promise<RoleInterface> {
    const { adapter, models } = this.getRoleContext();

    for (const param of searchParams) {
      const role = await adapter.findOne(models.roles, {
        where: {
          [param]: (payload as Record<string, unknown>)[param],
        },
      });

      if (role) return role as RoleInterface;
    }

    return (await adapter.create(models.roles, payload as Record<string, unknown>)) as RoleInterface;
  }

  public async updateRole(
    tenantId: string,
    roleId: RoleInterface['id'],
    payload: RoleEditRequestType,
    slugCase: boolean = true
  ): Promise<RoleInterface> {
    const { adapter, models, keys } = this.getRoleContext();

    const role = await adapter.findOne(models.roles, {
      where: { id: roleId, [keys.tenantId]: tenantId },
    });

    if (!role) {
      throw new RoleErrorHandler(RoleErrorHandler.NotExist);
    }

    const slug = slugCase
      ? Str.toSlugCase(payload.title)
      : Str.toSlugCaseWithUnderscores(payload.title);

    const updated = await adapter.update(
      models.roles,
      { id: roleId, [keys.tenantId]: tenantId },
      { ...payload, slug }
    );

    return (updated || role) as RoleInterface;
  }

  public async listRoles(tenantId: RoleInterface['tenantId']): Promise<Array<RoleInterface>> {
    const { adapter, models, keys } = this.getRoleContext();
    const tenant = await adapter.findOne(models.tenants, { where: { id: tenantId } });

    if (!tenant) {
      throw new TenantErrorHandler(TenantErrorHandler.DoesNotExist);
    }

    return (await adapter.findMany(models.roles, {
      where: {
        [keys.tenantId]: tenant.id,
      },
    })) as RoleInterface[];
  }

  public async findRole(
    tenantId: RoleInterface['tenantId'],
    identifier: string
  ): Promise<RoleInterface> {
    const role = await this.findRoleByIdentifier(tenantId, identifier);

    if (!role) {
      throw new RoleErrorHandler(RoleErrorHandler.NotExist);
    }

    return role;
  }

  public async deleteRole(
    tenantId: RoleInterface['tenantId'],
    roleId: RoleInterface['id']
  ): Promise<void> {
    const { adapter, models, keys } = this.getRoleContext();
    await this.findRoleById(tenantId, roleId);
    await adapter.delete(models.roles, { id: roleId, [keys.tenantId]: tenantId });
  }

  public async findRoleById(
    tenantId: RoleInterface['tenantId'],
    roleId: RoleInterface['id'],
    rejectIfNotFound = true
  ): Promise<RoleInterface> {
    const { adapter, models, keys } = this.getRoleContext();

    try {
      const role = await adapter.findOne(models.roles, {
        where: {
          id: roleId,
          [keys.tenantId]: tenantId,
        },
      });

      if (!role && rejectIfNotFound) {
        throw new RoleErrorHandler(RoleErrorHandler.RoleDoNotExist);
      }

      return role as RoleInterface;
    } catch (err) {
      throw new RoleErrorHandler(CommonErrorHandler.Fatal);
    }
  }

  public async addRoleWithPermissions(
    tenantId: RoleInterface['tenantId'],
    options: AddPermissionToRoleType
  ): Promise<Array<RolePermissionInterface>> {
    const { adapter, models, keys } = this.getRoleContext();
    hooks.emitHook('beforePermissionSync', { tenantId, role: options.role, permissions: options.permissions });

    const tenant = await adapter.findOne(models.tenants, { where: { id: tenantId } });
    if (!tenant) {
      throw new TenantErrorHandler(TenantErrorHandler.DoesNotExist);
    }

    const role = await this.findRole(tenant.id, options.role);
    const roleId = String(role.id);
    const identifiers = Array.isArray(options.permissions)
      ? options.permissions
      : [options.permissions];

    const permissionIds = await this.findPermissionIdsByIdentifiers(identifiers);

    const records = permissionIds.map((permissionId) => ({
      [keys.roleId]: roleId,
      [keys.permissionId]: permissionId,
    }));

    if (records.length === 0) return [];

    const created = adapter.createMany
      ? ((await adapter.createMany(models.rolePermissions, records)) as RolePermissionInterface[])
      : ((await Promise.all(
          records.map((record) => adapter.create(models.rolePermissions, record))
        )) as RolePermissionInterface[]);

    hooks.emitHook('afterPermissionSync', { tenantId, roleId, created });
    await AuditTrail.emit({
      action: 'role.permissions.sync',
      tenantId: String(tenantId),
      model: models.rolePermissions,
      after: { roleId, permissions: permissionIds },
    });

    return created;
  }

  public async syncRoleWithPermissions(
    tenantId: RoleInterface['tenantId'],
    options: AddPermissionToRoleType
  ): Promise<Array<RolePermissionInterface>> {
    const { adapter, models, keys } = this.getRoleContext();

    return Database.withTransaction(async () => {
      const getRole = await this.findRole(tenantId, options.role);
      await adapter.delete(models.rolePermissions, {
        [keys.roleId]: getRole.id,
      });

      return this.addRoleWithPermissions(tenantId, options);
    });
  }

  async findRolePermission(
    roleId: RolePermissionInterface['roleId'],
    permissionId: RolePermissionInterface['permissionId'],
    rejectIfNotFound: boolean = true
  ): Promise<RolePermissionInterface> {
    const { adapter, models, keys } = this.getRoleContext();

    try {
      const rolePermission = await adapter.findOne(models.rolePermissions, {
        where: {
          [keys.roleId]: roleId,
          [keys.permissionId]: permissionId,
        },
      });

      if (!rolePermission && rejectIfNotFound) {
        throw new RolePermissionErrorHandler(RolePermissionErrorHandler.DoesNotExist);
      }

      return rolePermission as RolePermissionInterface;
    } catch (e) {
      throw new RolePermissionErrorHandler(CommonErrorHandler.Fatal);
    }
  }

  public async userHasRole(payload: UserRoleRequestType): Promise<boolean> {
    const { adapter, models, keys } = this.getRoleContext();

    const userRole = await adapter.findOne(models.userRoles, {
      where: {
        [keys.roleId]: payload.roleId,
        [keys.tenantId]: payload.tenantId,
        [keys.userId]: payload.userId,
      },
    });

    return !!userRole;
  }

  public async roleHasPermission(
    payload: RolePermissionCreationType
  ): Promise<boolean> {
    const { adapter, models, keys } = this.getRoleContext();

    const rolePermission = await adapter.findOne(models.rolePermissions, {
      where: {
        [keys.roleId]: payload.roleId,
        [keys.permissionId]: payload.permissionId,
      },
    });

    return !!rolePermission;
  }

  public async findRoleByName(
    tenantId: RoleInterface['tenantId'],
    identifier: string,
    rejectIfNotFound = true
  ): Promise<RoleInterface> {
    const role = await this.findRoleByIdentifier(tenantId, identifier);

    if (!role && rejectIfNotFound) {
      throw new RoleErrorHandler(RoleErrorHandler.RoleDoNotExist);
    }

    return role as RoleInterface;
  }

  public async findRoles(
    tenantId: RoleInterface['tenantId'],
    identifiers: string[]
  ): Promise<Array<RoleInterface>> {
    const { adapter, models, keys } = this.getRoleContext();

    const [slugMatches, titleMatches] = await Promise.all([
      adapter.findMany(models.roles, {
        where: {
          [keys.tenantId]: tenantId,
          slug: identifiers,
        },
      }),
      adapter.findMany(models.roles, {
        where: {
          [keys.tenantId]: tenantId,
          title: identifiers,
        },
      }),
    ]);

    const deduped = new Map<string, RoleInterface>();
    [...slugMatches, ...titleMatches].forEach((role) => {
      deduped.set(String(role.id), role as RoleInterface);
    });

    const matched = [...deduped.values()];
    if (matched.length < 1) {
      throw new RoleErrorHandler(RoleErrorHandler.NotExist);
    }

    return matched;
  }

  public async upsertRole(
    tenantSlug: string,
    payload: RoleCreationRequestType,
    slugCase: boolean = true
  ): Promise<RoleInterface> {
    const [role] = await this.createRole(tenantSlug, payload, slugCase);
    return role;
  }

  public async grantPermissionsToRole(
    tenantId: RoleInterface['tenantId'],
    role: string,
    permissions: string[]
  ): Promise<Array<RolePermissionInterface>> {
    assertArrayHasItems(permissions, 'permissions');
    return this.addRoleWithPermissions(tenantId, { role, permissions });
  }

  public async revokePermissionsFromRole(
    tenantId: RoleInterface['tenantId'],
    role: string,
    permissions: string[]
  ): Promise<number> {
    assertArrayHasItems(permissions, 'permissions');
    const { adapter, models, keys } = this.getRoleContext();
    const targetRole = await this.findRole(tenantId, role);
    const permissionIds = await this.findPermissionIdsByIdentifiers(normalizeToArray(permissions));

    if (!permissionIds.length) return 0;

    const existing = await adapter.findMany(models.rolePermissions, {
      where: {
        [keys.roleId]: targetRole.id,
        [keys.permissionId]: permissionIds,
      },
    });

    if (!existing.length) return 0;

    let deleted = 0;
    await Promise.all(
      existing.map(async (row) => {
        deleted += await adapter.delete(models.rolePermissions, { id: row.id });
      })
    );

    await AuditTrail.emit({
      action: 'role.permissions.sync',
      tenantId: String(tenantId),
      model: models.rolePermissions,
      after: { roleId: targetRole.id, revoked: permissionIds },
    });

    return deleted;
  }
}

const roleService = new RoleService();
export default roleService;
