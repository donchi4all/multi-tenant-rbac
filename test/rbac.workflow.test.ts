import { createRbac } from './helpers/createRbac';

describe('RBAC workflow', () => {
  it('handles end-to-end multi-tenant authorization workflow', async () => {
    const rbac = await createRbac();

    const [p1, p2] = await rbac.createPermission([
      { title: 'read:invoice', description: 'Read invoices', isActive: true },
      { title: 'write:invoice', description: 'Write invoices', isActive: true },
    ]);

    expect(p1.id).toBeDefined();
    expect(p2.id).toBeDefined();

    const tenantA = await rbac.createTenant({
      name: 'alpha-tenant',
      description: 'Alpha',
      isActive: true,
    });

    const tenantB = await rbac.createTenant({
      name: 'beta-tenant',
      description: 'Beta',
      isActive: true,
    });

    const [roleA] = await rbac.createRole(tenantA.slug, {
      title: 'manager',
      description: 'Manager A',
      isActive: true,
    });

    const [roleB] = await rbac.createRole(tenantB.slug, {
      title: 'manager',
      description: 'Manager B',
      isActive: true,
    });

    await rbac.syncRoleWithPermissions(tenantA.id, {
      role: roleA.slug,
      permissions: ['read:invoice'],
    });

    await rbac.syncRoleWithPermissions(tenantB.id, {
      role: roleB.slug,
      permissions: ['write:invoice'],
    });

    await rbac.assignRoleToUser({
      tenantId: tenantA.id,
      userId: 'user-1',
      roleSlug: roleA.slug,
    });

    await rbac.assignRoleToUser({
      tenantId: tenantB.id,
      userId: 'user-1',
      roleSlug: roleB.slug,
    });

    expect(await rbac.authorize(tenantA.id, 'user-1', 'read:invoice')).toBe(true);
    expect(await rbac.authorize(tenantA.id, 'user-1', 'write:invoice')).toBe(false);
    expect(await rbac.authorize(tenantB.id, 'user-1', 'write:invoice')).toBe(true);

    const roleViewA = await rbac.getUserRole(tenantA.id, 'user-1');
    expect(roleViewA.roles).toHaveLength(1);

    const tenantRoles = await rbac.getTenantWithRolesAndPermissions(tenantA.slug);
    expect(tenantRoles.roles?.length).toBeGreaterThan(0);

    const effectiveA = await rbac.listEffectivePermissions(tenantA.id, 'user-1');
    expect(effectiveA.map((item) => item.title)).toContain('read:invoice');

    const byRole = await rbac.findUserByRole(tenantA.id, roleA.slug);
    expect(byRole).toHaveLength(1);

    const revoked = await rbac.revokeRoleFromUser(tenantA.id, 'user-1', roleA.slug);
    expect(revoked).toBeGreaterThan(0);
    expect(await rbac.authorize(tenantA.id, 'user-1', 'read:invoice')).toBe(false);
  });

  it('supports bulk assign and sync user roles', async () => {
    const rbac = await createRbac();
    const tenant = await rbac.createTenant({ name: 'gamma-tenant', description: 'Gamma', isActive: true });

    await rbac.createPermission([
      { title: 'read:profile', description: 'Read profile', isActive: true },
      { title: 'write:profile', description: 'Write profile', isActive: true },
    ]);

    const [reader] = await rbac.createRole(tenant.slug, { title: 'reader', description: 'Reader', isActive: true });
    const [writer] = await rbac.createRole(tenant.slug, { title: 'writer', description: 'Writer', isActive: true });

    await rbac.grantPermissionsToRole(tenant.id, reader.slug, ['read:profile']);
    await rbac.grantPermissionsToRole(tenant.id, writer.slug, ['write:profile']);

    const bulk = await rbac.assignRolesToUserBulk(tenant.id, 'user-2', [reader.slug, writer.slug]);
    expect(bulk).toHaveLength(2);

    const sync = await rbac.syncUserRoles(tenant.id, 'user-2', [reader.slug]);
    expect(sync).toHaveLength(1);

    expect(await rbac.authorize(tenant.id, 'user-2', 'read:profile')).toBe(true);
    expect(await rbac.authorize(tenant.id, 'user-2', 'write:profile')).toBe(false);
  });
});
