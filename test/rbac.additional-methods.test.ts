import { createRbac } from './helpers/createRbac';

describe('RBAC additional method coverage', () => {
  it('covers tenant get/update/delete and graph methods', async () => {
    const rbac = await createRbac();

    const tenant = await rbac.createTenant({
      name: 'ops-tenant',
      description: 'operations',
      isActive: true,
    });

    const got = await rbac.getTenant(tenant.slug);
    expect(got.id).toBe(tenant.id);

    const updated = await rbac.updateTenant(tenant.slug, {
      description: 'operations-updated',
    });
    expect(updated.description).toBe('operations-updated');

    await rbac.createPermission([
      { title: 'read:ops', description: 'read', isActive: true },
    ]);

    const [role] = await rbac.createRole(tenant.slug, {
      title: 'ops',
      description: 'ops role',
      isActive: true,
    });

    await rbac.addRoleWithPermissions(tenant.id, { role: role.slug, permissions: ['read:ops'] });
    await rbac.assignRoleToUser({ tenantId: tenant.id, userId: 'ops-user', roleSlug: role.slug });

    const byUser = await rbac.getUserWithRoleAndPermissions(tenant.slug);
    expect(byUser.roles?.length).toBeGreaterThan(0);

    const byTenant = await rbac.getTenantWithRolesAndPermissions(tenant.slug);
    expect(byTenant.roles?.length).toBeGreaterThan(0);

    const roleAndPerms = await rbac.getUserRolesAndPermissions(tenant.id as string, 'ops-user');
    expect(roleAndPerms.roles.length).toBeGreaterThan(0);

    const deleted = await rbac.deleteTenant(tenant.slug);
    expect(deleted.slug).toBe(tenant.slug);
  });

  it('covers findOrCreateRole and findRolePermission', async () => {
    const rbac = await createRbac();
    const tenant = await rbac.createTenant({ name: 'fc-tenant', description: 'fc', isActive: true });

    await rbac.createPermission([
      { title: 'read:fc', description: 'read', isActive: true },
    ]);

    const created = await rbac.findOrCreateRole(['slug'], {
      tenantId: tenant.id,
      title: 'fc-role',
      slug: 'fc-role',
      description: 'fc role',
      isActive: true,
    });

    expect(created.id).toBeDefined();

    const existing = await rbac.findOrCreateRole(['slug'], {
      tenantId: tenant.id,
      title: 'fc-role',
      slug: 'fc-role',
      description: 'fc role',
      isActive: true,
    });
    expect(existing.slug).toBe('fc-role');

    const links = await rbac.addRoleWithPermissions(tenant.id, { role: 'fc-role', permissions: ['read:fc'] });
    const link = await rbac.findRolePermission(links[0].roleId, links[0].permissionId);
    expect(link.id).toBeDefined();

    await expect(rbac.findRolePermission('missing', 'missing')).rejects.toBeTruthy();
    await expect(rbac.findRolePermission('missing', 'missing', false)).resolves.toBeFalsy();
  });
});
