import { createRbac } from './helpers/createRbac';

describe('RBAC edge cases', () => {
  it('covers tenant edge conditions', async () => {
    const rbac = await createRbac();

    await expect(rbac.findTenant('missing-tenant')).rejects.toBeTruthy();

    const tenant = await rbac.createTenant({
      name: 'edge-tenant',
      description: 'edge',
      isActive: false,
    });

    const tenantAgain = await rbac.createTenant(
      { name: 'edge-tenant', description: 'edge', isActive: false },
      true
    );
    expect(tenantAgain.id).toBe(tenant.id);

    await expect(
      rbac.createTenant({ name: 'edge-tenant', description: 'edge', isActive: false }, false)
    ).rejects.toBeTruthy();

    await expect(rbac.deleteTenant(tenant.slug)).rejects.toBeTruthy();

    await expect(rbac.updateTenant('unknown', { description: 'none' })).rejects.toBeTruthy();

    const userRoleView = await rbac.getUserRole(tenant.id, 'no-user', false);
    expect(userRoleView.roles).toHaveLength(0);

    await expect(rbac.getUserPermissions(tenant.id as string, 'no-user')).rejects.toThrow();

    expect(await rbac.userHasPermission({ tenantId: tenant.id, userId: 'u', permission: 'none' })).toBe(false);

    await expect(rbac.syncUserRoles(tenant.id, 'u', [])).rejects.toBeTruthy();
  });

  it('covers role and permission error paths', async () => {
    const rbac = await createRbac();

    await expect(
      rbac.updatePermission('missing', {
        title: 'x',
        description: 'x',
        isActive: true,
      })
    ).rejects.toBeTruthy();

    await expect(rbac.findPermissionById('missing')).rejects.toBeTruthy();
    await expect(rbac.findPermissionById('missing', false)).resolves.toBeFalsy();

    const tenant = await rbac.createTenant({ name: 'role-edge', description: 'role', isActive: true });
    await expect(rbac.createRole('not-existing-tenant', { title: 'x', description: 'x', isActive: true })).rejects.toBeTruthy();

    const [role] = await rbac.createRole(tenant.slug, {
      title: 'edge-role',
      description: 'edge role',
      isActive: true,
    });

    await expect(rbac.findRole(tenant.id, 'missing-role')).rejects.toBeTruthy();
    await expect(rbac.findRoles(tenant.id, ['missing-role'])).rejects.toBeTruthy();

    const roleByName = await rbac.findRoleByName(tenant.id, 'missing-role', false);
    expect(roleByName).toBeFalsy();

    const revokeNone = await rbac.revokePermissionsFromRole(tenant.id, role.slug, ['missing:perm']);
    expect(revokeNone).toBe(0);

    await expect(
      rbac.grantPermissionsToRole(tenant.id, role.slug, [])
    ).rejects.toBeTruthy();

    await expect(
      rbac.assignRoleToUser({ tenantId: tenant.id, userId: 'u1', roleSlug: role.slug })
    ).resolves.toBeTruthy();

    await expect(
      rbac.assignRoleToUser({ tenantId: tenant.id, userId: 'u1', roleSlug: role.slug })
    ).rejects.toBeTruthy();
  });
});
