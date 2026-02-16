import { createRbac } from './helpers/createRbac';

describe('RBAC role/permission methods', () => {
  it('supports upsertRole, role checks, and permission revoke', async () => {
    const rbac = await createRbac();

    const tenant = await rbac.createTenant({
      name: 'role-tenant',
      description: 'Role test',
      isActive: true,
    });

    await rbac.ensurePermissions([
      { title: 'view:logs', description: 'View logs', isActive: true },
      { title: 'delete:logs', description: 'Delete logs', isActive: true },
    ]);

    const role = await rbac.upsertRole(tenant.slug, {
      title: 'auditor',
      description: 'Auditor role',
      isActive: true,
    });

    const roleAgain = await rbac.upsertRole(tenant.slug, {
      title: 'auditor',
      description: 'Auditor role',
      isActive: true,
    });

    expect(roleAgain.id).toEqual(role.id);

    const grants = await rbac.grantPermissionsToRole(tenant.id, role.slug, [
      'view:logs',
      'delete:logs',
    ]);
    expect(grants.length).toBeGreaterThan(0);

    const byId = await rbac.findRoleById(tenant.id, role.id);
    expect(byId.slug).toBe(role.slug);

    const exists = await rbac.findRole(tenant.id, role.slug);
    expect(exists.id).toBe(role.id);

    await rbac.assignRoleToUser({ tenantId: tenant.id, userId: 'u-role', roleSlug: role.slug });

    const hasRole = await rbac.userHasRole({
      tenantId: tenant.id as string,
      userId: 'u-role',
      roleId: role.id as string,
    });
    expect(hasRole).toBe(true);

    const roleHasPermission = await rbac.roleHasPermission({
      roleId: role.id as string,
      permissionId: grants[0].permissionId,
    });
    expect(roleHasPermission).toBe(true);

    const revoked = await rbac.revokePermissionsFromRole(tenant.id, role.slug, ['delete:logs']);
    expect(revoked).toBeGreaterThan(0);

    const roles = await rbac.listRoles(tenant.id);
    expect(roles.length).toBeGreaterThan(0);

    await rbac.deleteRole(tenant.id, role.id);
    await expect(rbac.findRole(tenant.id, role.slug)).rejects.toBeTruthy();
  });

  it('supports permission CRUD + upsert', async () => {
    const rbac = await createRbac();

    const [permission] = await rbac.createPermission([
      { title: 'create:user', description: 'Create user', isActive: true },
    ]);

    const found = await rbac.findPermission('create:user');
    expect(found.id).toBe(permission.id);

    const byId = await rbac.findPermissionById(permission.id);
    expect(byId.slug).toBe(permission.slug);

    const updated = await rbac.updatePermission(permission.id as string, {
      title: 'create:member',
      description: 'Create member',
      isActive: true,
    });
    expect(updated.slug).toContain('createmember');

    const upsertExisting = await rbac.upsertPermission({
      title: 'create:member',
      description: 'Create member',
      isActive: true,
    });
    expect(upsertExisting.id).toBe(updated.id);

    const upsertNew = await rbac.upsertPermission({
      title: 'delete:member',
      description: 'Delete member',
      isActive: true,
    });
    expect(upsertNew.id).toBeDefined();

    const list = await rbac.listPermissions();
    expect(list.length).toBeGreaterThan(1);

    await rbac.deletePermission('delete:member');
    await expect(rbac.findPermission('delete:member')).rejects.toBeTruthy();
  });
});
