import { createRbac } from './helpers/createRbac';
import { IRbacAdapter, rbacConfig } from '../src/core/types';
import { Database } from '../src';
import InMemoryAdapter from '../src/adapters/memory';

class InMemoryNoBulkAdapter implements IRbacAdapter {
  private inner = new InMemoryAdapter();

  async findOne(model: string, query: { where?: Record<string, unknown> }) {
    return this.inner.findOne(model, query);
  }

  async findMany(model: string, query?: { where?: Record<string, unknown> }) {
    return this.inner.findMany(model, query);
  }

  async create(model: string, data: Record<string, any>) {
    return this.inner.create(model, data);
  }

  async update(model: string, where: Record<string, unknown>, data: Record<string, any>) {
    return this.inner.update(model, where, data);
  }

  async delete(model: string, where: Record<string, unknown>) {
    return this.inner.delete(model, where);
  }
}

class FailCreateAdapter extends InMemoryNoBulkAdapter {
  async create(model: string, data: Record<string, any>) {
    if (model.includes('user')) {
      throw new Error('create failed');
    }
    return super.create(model, data);
  }
}

describe('RBAC branch behavior', () => {
  it('covers non-bulk adapter fallbacks', async () => {
    const rbac = await createRbac({}, new InMemoryNoBulkAdapter());

    const tenant = await rbac.createTenant({ name: 'bulk-tenant', description: 'bulk', isActive: true });
    await rbac.createPermission([
      { title: 'read:bulk', description: 'read', isActive: true },
    ]);
    const [role] = await rbac.createRole(tenant.slug, {
      title: 'bulk-role',
      description: 'bulk role',
      isActive: true,
    });

    const links = await rbac.addRoleWithPermissions(tenant.id, {
      role: role.slug,
      permissions: ['read:bulk'],
    });
    expect(links.length).toBeGreaterThan(0);

    const synced = await rbac.syncUserWithRole({
      tenantId: tenant.id,
      userId: 'bulk-user',
      role: role.slug,
    });
    expect(Array.isArray(synced)).toBe(true);
  });

  it('covers explicit not-found and throw branches', async () => {
    const rbac = await createRbac();
    const tenant = await rbac.createTenant({ name: 'branch-tenant', description: 'branch', isActive: true });

    await expect(rbac.findTenantById('missing')).rejects.toBeTruthy();
    await expect(rbac.findRoleById(tenant.id, 'missing')).rejects.toBeTruthy();

    await expect(rbac.getUserRole(tenant.id, 'missing-user')).rejects.toBeTruthy();
    await expect(rbac.getUserRolesAndPermissions(tenant.id as string, 'missing-user')).rejects.toBeTruthy();

    await expect(rbac.findRoleByName(tenant.id, 'missing')).rejects.toBeTruthy();
  });

  it('bubbles create failures from assignRoleToUser', async () => {
    const adapter = new FailCreateAdapter();
    const config: rbacConfig = { adapter };
    await Database.init(config);
    const rbac = await createRbac({}, adapter);

    const tenant = await rbac.createTenant({ name: 'fail-tenant', description: 'fail', isActive: true });
    await rbac.createPermission([{ title: 'x', description: 'x', isActive: true }]);
    const [role] = await rbac.createRole(tenant.slug, {
      title: 'x-role',
      description: 'x-role',
      isActive: true,
    });

    await expect(
      rbac.assignRoleToUser({ tenantId: tenant.id, userId: 'u-fail', roleSlug: role.slug })
    ).rejects.toThrow('create failed');
  });

  it('covers updateRole success and missing tenant listRoles', async () => {
    const rbac = await createRbac();
    const tenant = await rbac.createTenant({ name: 'update-tenant', description: 'u', isActive: true });
    const [role] = await rbac.createRole(tenant.slug, {
      title: 'updatable',
      description: 'old',
      isActive: true,
    });

    const updated = await rbac.updateRole(tenant.id as string, role.id, {
      title: 'updated-role',
      description: 'new',
      isActive: true,
    });

    expect(updated.title).toBe('updated-role');

    await expect(rbac.listRoles('missing-tenant')).rejects.toBeTruthy();
  });
});
