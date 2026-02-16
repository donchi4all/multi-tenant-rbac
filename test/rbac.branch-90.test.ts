import { Database as DatabaseClass } from '../src/modules/database';
import { IRbacAdapter, rbacConfig } from '../src/core/types';
import InMemoryAdapter from '../src/adapters/memory';
import { createRbac } from './helpers/createRbac';

class InitAdapter extends InMemoryAdapter {
  public initialized = false;

  async init(): Promise<void> {
    this.initialized = true;
  }
}

class NullUpdateAdapter extends InMemoryAdapter {
  constructor(private readonly modelsToNull: string[]) {
    super();
  }

  async update(model: string, where: Record<string, unknown>, data: Record<string, any>) {
    if (this.modelsToNull.includes(model)) {
      await super.update(model, where, data);
      return null;
    }

    return super.update(model, where, data);
  }
}

class PassiveAdapter implements IRbacAdapter {
  async findOne(): Promise<Record<string, any> | null> {
    return null;
  }

  async findMany(): Promise<Record<string, any>[]> {
    return [];
  }

  async create(_model: string, data: Record<string, any>): Promise<Record<string, any>> {
    return data;
  }

  async update(): Promise<Record<string, any> | null> {
    return null;
  }

  async delete(): Promise<number> {
    return 0;
  }
}

describe('Branch >= 90 targeted coverage', () => {
  it('covers database adapter init optional branch', async () => {
    const db = new DatabaseClass();
    const adapter = new InitAdapter();
    await db.init({ adapter } as rbacConfig);
    expect(adapter.initialized).toBe(true);

    const dbNoInit = new DatabaseClass();
    await dbNoInit.init({ adapter: new PassiveAdapter() });
    expect(dbNoInit.getAdapter()).toBeTruthy();
  });

  it('covers permission branch paths and fallbacks', async () => {
    const rbac = await createRbac();

    const createdAsSingle = await rbac.createPermission(
      { title: 'Only Single', description: 'single', isActive: true } as any,
      false
    );
    expect(createdAsSingle[0].slug).toBe('only_single');

    const foundBySlug = await rbac.findPermission('only_single');
    expect(foundBySlug.id).toBe(createdAsSingle[0].id);

    const foundByTitle = await rbac.findPermission('Only Single');
    expect(foundByTitle.id).toBe(createdAsSingle[0].id);

    const upserted = await rbac.upsertPermission(
      { title: 'Other Single', description: 'single', isActive: true },
      false
    );
    expect(upserted.slug).toBe('other_single');

    const ensured = await rbac.ensurePermissions(
      { title: 'Ensured One', description: 'one', isActive: true } as any,
      false
    );
    expect(ensured).toHaveLength(1);
  });

  it('covers update fallback branches for permission/role/tenant', async () => {
    const adapter = new NullUpdateAdapter(['permissions', 'roles', 'tenants']);
    const rbac = await createRbac({}, adapter);

    const [perm] = await rbac.createPermission([{ title: 'Perm U', description: 'u', isActive: true }]);
    const permUpdated = await rbac.updatePermission(perm.id as string, {
      title: 'Perm U2',
      description: 'u2',
      isActive: true,
    });
    expect(permUpdated.id).toBe(perm.id);

    const tenant = await rbac.createTenant({ name: 'tenant-u', description: 'u', isActive: true });
    const tenantUpdated = await rbac.updateTenant(tenant.slug, { description: 'changed' });
    expect(tenantUpdated.id).toBe(tenant.id);

    const [role] = await rbac.createRole(tenant.slug, { title: 'Role U', description: 'u', isActive: true });
    const roleUpdated = await rbac.updateRole(tenant.id as string, role.id, {
      title: 'Role U2',
      description: 'u2',
      isActive: true,
    });
    expect(roleUpdated.id).toBe(role.id);
  });

  it('covers create/update role branch variants', async () => {
    const rbac = await createRbac();
    const tenant = await rbac.createTenant({ name: 'role-branch', description: 'rb', isActive: true }, true, false);

    const roles = await rbac.createRole(
      tenant.slug,
      [
        { title: 'Lead One', description: 'lead', isActive: true },
        { title: 'Lead Two', description: 'lead', isActive: true },
      ],
      false
    );
    expect(roles[0].slug).toBe('lead_one');

    await expect(
      rbac.updateRole(tenant.id as string, 'missing-role-id', {
        title: 'nope',
        description: 'nope',
        isActive: true,
      })
    ).rejects.toBeTruthy();

    const updated = await rbac.updateRole(
      tenant.id as string,
      roles[0].id,
      { title: 'Lead Three', description: 'lead', isActive: true },
      false
    );
    expect(updated.slug).toBe('lead_three');
  });

  it('covers addRoleWithPermissions and revoke branches', async () => {
    const rbac = await createRbac();
    const tenant = await rbac.createTenant({ name: 'perm-branch', description: 'pb', isActive: true });

    await expect(
      rbac.addRoleWithPermissions('missing-tenant', { role: 'missing', permissions: 'x' as any })
    ).rejects.toBeTruthy();

    await rbac.createPermission([
      { title: 'p.one', description: 'p1', isActive: true },
      { title: 'p.two', description: 'p2', isActive: true },
    ]);

    const [role] = await rbac.createRole(tenant.slug, { title: 'perm-role', description: 'pr', isActive: true });

    const singleGrant = await rbac.addRoleWithPermissions(tenant.id, {
      role: role.slug,
      permissions: 'p.one' as any,
    });
    expect(singleGrant.length).toBeGreaterThan(0);

    const noGrant = await rbac.addRoleWithPermissions(tenant.id, {
      role: role.slug,
      permissions: ['missing.permission'],
    });
    expect(noGrant).toEqual([]);

    const revoked = await rbac.revokePermissionsFromRole(tenant.id, role.slug, ['p.one']);
    expect(revoked).toBeGreaterThan(0);
  });

  it('covers tenant role/user null branches and cache branch', async () => {
    const rbac = await createRbac();
    const tenant = await rbac.createTenant({ name: 'tenant-branch', description: 'tb', isActive: true }, true, false);

    await rbac.createPermission([{ title: 'tenant.read', description: 'tr', isActive: true }]);
    const [role] = await rbac.createRole(tenant.slug, { title: 'tenant-role', description: 'tr', isActive: true });

    await rbac.addRoleWithPermissions(tenant.id, { role: role.slug, permissions: ['tenant.read'] });
    await rbac.assignRoleToUser({ tenantId: tenant.id, userId: 'user-tb', roleSlug: role.slug });

    const p1 = await rbac.listEffectivePermissions(tenant.id, 'user-tb');
    const p2 = await rbac.listEffectivePermissions(tenant.id, 'user-tb');
    expect(p2).toEqual(p1);

    expect(await rbac.userHasPermission({ userId: 'user-tb', permission: 'tenant.read' })).toBe(true);

    await rbac.deleteRole(tenant.id, role.id);

    const userRoleNoThrow = await rbac.getUserRole(tenant.id, 'user-tb', false);
    expect(userRoleNoThrow.roles).toHaveLength(0);

    const userRolePermNoThrow = await rbac.getUserRolesAndPermissions(tenant.id as string, 'user-tb', false);
    expect(userRolePermNoThrow.roles).toHaveLength(0);

    const byTenantUsers = await rbac.getUserWithRoleAndPermissions(tenant.slug);
    expect(Array.isArray(byTenantUsers.roles)).toBe(true);

    const foundNoThrow = await rbac.findUserRole(tenant.id, 'user-tb', 'missing-role-id', false);
    expect(foundNoThrow).toBeFalsy();

    await expect(rbac.findUserRole(tenant.id, 'user-tb', 'missing-role-id', true)).rejects.toBeTruthy();
  });
});
