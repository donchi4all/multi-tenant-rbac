import {
  createTypedRBAC,
  Database,
  InMemoryAdapter,
  rbacConfig,
} from '../src';

describe('typed RBAC advanced API', () => {
  it('supports compile-time keyed payloads and runtime behavior with custom keys', async () => {
    const config = {
      adapter: new InMemoryAdapter(),
      models: {
        users: 'rbac_admins_v2',
        tenants: 'rbac_workspaces_v2',
        roles: 'rbac_acl_roles_v2',
        permissions: 'rbac_acl_permissions_v2',
        userRoles: 'rbac_admin_role_links_v2',
        rolePermissions: 'rbac_role_permission_links_v2',
      },
      keys: {
        userId: 'adminId',
        tenantId: 'workspaceId',
        roleId: 'roleRefId',
        permissionId: 'permissionRefId',
      },
    } as const satisfies rbacConfig;

    await Database.init(config);
    const rbac = createTypedRBAC(config);

    await rbac.ensurePermissions([
      { title: 'invoice.read', description: 'Read invoices', isActive: true },
      { title: 'invoice.manage', description: 'Manage invoices', isActive: true },
    ]);

    const tenant = await rbac.createTenant({
      name: 'typed-tenant',
      description: 'typed',
      isActive: true,
    });
    const tenantId = String(tenant.id);

    const role = await rbac.upsertRole(tenant.slug, {
      title: 'typed-admin',
      description: 'typed',
      isActive: true,
    });

    await rbac.syncRoleWithPermissions(tenant.id, {
      role: role.slug,
      permissions: ['invoice.read'],
    });

    const granted = await rbac.grantPermissionsToRole(tenant.id, role.slug, ['invoice.manage']);
    expect(granted.length).toBeGreaterThan(0);

    await rbac.assignRoleToUser({
      workspaceId: tenantId,
      adminId: 'admin-1',
      roleSlug: role.slug,
    });

    const allowed = await rbac.authorize({
      workspaceId: tenantId,
      adminId: 'admin-1',
      permission: 'invoice.read',
    });
    expect(allowed).toBe(true);

    const roleView = await rbac.getUserRole({
      workspaceId: tenantId,
      adminId: 'admin-1',
    });

    expect(roleView.adminId).toBe('admin-1');
    expect(roleView.roles).toHaveLength(1);
    expect(rbac.typedConfig.keys.userId).toBe('adminId');

    const roleAndPermissions = await rbac.getUserRolesAndPermissions({
      workspaceId: tenantId,
      adminId: 'admin-1',
      rejectIfNotFound: false,
    });
    expect(roleAndPermissions.adminId).toBe('admin-1');
    expect(roleAndPermissions.roles).toHaveLength(1);

    const permissionView = await rbac.getUserPermissions({
      workspaceId: tenantId,
      adminId: 'admin-1',
    });
    expect(permissionView.adminId).toBe('admin-1');
    expect(permissionView.permissions.map((item) => item.title)).toContain('invoice.read');

    const effective = await rbac.listEffectivePermissions({
      workspaceId: tenantId,
      adminId: 'admin-1',
    });
    expect(effective.map((item) => item.title)).toContain('invoice.read');

    // Runtime fallback branch: advanced API also accepts canonical keys as fallback.
    const allowedWithFallback = await rbac.authorize({
      tenantId,
      userId: 'admin-1',
      permission: 'invoice.read',
    } as any);
    expect(allowedWithFallback).toBe(true);

    const revoked = await rbac.revokeRoleFromUser({
      workspaceId: tenantId,
      adminId: 'admin-1',
      roleSlug: role.slug,
    });
    expect(revoked).toBeGreaterThan(0);

    await expect(
      rbac.getUserRole({
        workspaceId: tenantId,
        adminId: 'admin-1',
      })
    ).rejects.toThrow();

    await expect(
      rbac.getUserRole({} as any)
    ).rejects.toThrow('Missing "workspaceId"');

    const bulk = await rbac.assignRolesToUserBulk({
      workspaceId: tenantId,
      adminId: 'admin-1',
      roleSlugs: [role.slug],
    });
    expect(bulk).toHaveLength(1);

    const synced = await rbac.syncUserRoles({
      workspaceId: tenantId,
      adminId: 'admin-1',
      roleSlugs: [role.slug],
    });
    expect(synced).toHaveLength(1);

    const byRole = await rbac.findUserByRole({
      workspaceId: tenantId,
      roleSlug: role.slug,
    });
    expect(byRole.length).toBeGreaterThan(0);

    const hasPermission = await rbac.userHasPermission({
      workspaceId: tenantId,
      adminId: 'admin-1',
      permission: 'invoice.read',
    });
    expect(hasPermission).toBe(true);

    const manageAllowed = await rbac.authorize({
      workspaceId: tenantId,
      adminId: 'admin-1',
      permission: 'invoice.manage',
    });
    expect(manageAllowed).toBe(true);

    const revokedPermissions = await rbac.revokePermissionsFromRole(
      tenant.id,
      role.slug,
      ['invoice.manage']
    );
    expect(revokedPermissions).toBeGreaterThan(0);

    const hasPermissionAdvanced = await rbac.userHasPermissionAdvanced({
      workspaceId: tenantId,
      adminId: 'admin-1',
      permission: 'invoice.read',
    });
    expect(hasPermissionAdvanced).toBe(true);

    const bulkAdvanced = await rbac.assignRolesToUserBulkAdvanced({
      workspaceId: tenantId,
      adminId: 'admin-2',
      roleSlugs: [role.slug],
    });
    expect(bulkAdvanced.length).toBeGreaterThan(0);

    const syncedAdvanced = await rbac.syncUserRolesAdvanced({
      workspaceId: tenantId,
      adminId: 'admin-2',
      roleSlugs: [role.slug],
    });
    expect(syncedAdvanced.length).toBeGreaterThan(0);

    const byRoleAdvanced = await rbac.findUserByRoleAdvanced({
      workspaceId: tenantId,
      roleSlug: role.slug,
    });
    expect(byRoleAdvanced.length).toBeGreaterThan(0);

    const roleViaArgs = await rbac.getUserRole(tenantId, 'admin-1', false);
    expect(roleViaArgs.roles.length).toBeGreaterThan(0);

    expect(() =>
      rbac.assignRoleToUser({
        workspaceId: tenantId,
        adminId: 'admin-2',
      } as any)
    ).toThrow('Missing "roleSlug"');

    expect(() =>
      rbac.authorize({
        workspaceId: tenantId,
        adminId: 'admin-1',
      } as any)
    ).toThrow('Missing "permission"');

    // @ts-expect-error advanced typed payload requires adminId/workspaceId keys from config
    const _invalidPayload: Parameters<typeof rbac.assignRoleToUser>[0] = { tenantId, userId: 'admin-2', roleSlug: role.slug };
    expect(_invalidPayload).toBeDefined();
  });
});
