/**
 * Example host-app test harness (outside package internals).
 *
 * In a real parent project:
 * - replace imports from '../src' with 'multi-tenant-rbac'
 * - wire ParentModelsAdapter with your own ORM repositories
 */

import MultiTenantRBAC, {
  InMemoryAdapter,
  IRbacAdapter,
  RbacKeysConfig,
  RbacModelsConfig,
  rbacConfig,
} from '../src';

type HostRepo = {
  findOne(where: Record<string, unknown>): Promise<Record<string, any> | null>;
  findMany(where?: Record<string, unknown>): Promise<Record<string, any>[]>;
  create(data: Record<string, any>): Promise<Record<string, any>>;
  createMany?(rows: Record<string, any>[]): Promise<Record<string, any>[]>;
  update(where: Record<string, unknown>, data: Record<string, any>): Promise<Record<string, any> | null>;
  delete(where: Record<string, unknown>): Promise<number>;
};

/**
 * Adapter that lets RBAC use parent-project repositories directly.
 * No extra ORM dependency is required in this package.
 */
export class ParentModelsAdapter implements IRbacAdapter {
  constructor(private readonly repositories: Record<string, HostRepo>) {}

  private repo(model: string): HostRepo {
    const found = this.repositories[model];
    if (!found) {
      throw new Error(`ParentModelsAdapter repository not configured for model: ${model}`);
    }
    return found;
  }

  async findOne(model: string, query: { where?: Record<string, unknown> }) {
    return this.repo(model).findOne(query.where || {});
  }

  async findMany(model: string, query?: { where?: Record<string, unknown> }) {
    return this.repo(model).findMany(query?.where || {});
  }

  async create(model: string, data: Record<string, any>) {
    return this.repo(model).create(data);
  }

  async createMany(model: string, data: Record<string, any>[]) {
    const repository = this.repo(model);
    if (repository.createMany) {
      return repository.createMany(data);
    }
    return Promise.all(data.map((row) => repository.create(row)));
  }

  async update(model: string, where: Record<string, unknown>, data: Record<string, any>) {
    return this.repo(model).update(where, data);
  }

  async delete(model: string, where: Record<string, unknown>) {
    return this.repo(model).delete(where);
  }
}

export class ParentProjectRbacTester {
  constructor(private readonly rbac: MultiTenantRBAC) {}

  static create(config?: Partial<rbacConfig>): ParentProjectRbacTester {
    const rbac = new MultiTenantRBAC({
      adapter: config?.adapter || new InMemoryAdapter(),
      ...config,
    });

    return new ParentProjectRbacTester(rbac);
  }

  /**
   * Minimal smoke test that validates tenant isolation behavior.
   */
  async smokeTestMultiTenant(): Promise<{ ok: boolean; details: Record<string, unknown> }> {
    const permissions = await this.rbac.createPermission([
      { title: 'read:invoice', description: 'Read invoice', isActive: true },
      { title: 'write:invoice', description: 'Write invoice', isActive: true },
    ]);

    const tenantA = await this.rbac.createTenant({
      name: 'tenant-a',
      description: 'A',
      isActive: true,
    });

    const tenantB = await this.rbac.createTenant({
      name: 'tenant-b',
      description: 'B',
      isActive: true,
    });

    const [roleA] = await this.rbac.createRole(tenantA.slug, {
      title: 'manager-a',
      description: 'manager in tenant A',
      isActive: true,
    });

    const [roleB] = await this.rbac.createRole(tenantB.slug, {
      title: 'manager-b',
      description: 'manager in tenant B',
      isActive: true,
    });

    await this.rbac.syncRoleWithPermissions(tenantA.id, {
      role: roleA.slug,
      permissions: ['read:invoice'],
    });

    await this.rbac.syncRoleWithPermissions(tenantB.id, {
      role: roleB.slug,
      permissions: ['write:invoice'],
    });

    await this.rbac.assignRoleToUser({
      tenantId: tenantA.id,
      userId: 'user-1',
      roleSlug: roleA.slug,
    });

    await this.rbac.assignRoleToUser({
      tenantId: tenantB.id,
      userId: 'user-1',
      roleSlug: roleB.slug,
    });

    const rolesInTenantA = await this.rbac.getUserRole(tenantA.id, 'user-1');
    const rolesInTenantB = await this.rbac.getUserRole(tenantB.id, 'user-1');

    const ok = rolesInTenantA.roles.length > 0 && rolesInTenantB.roles.length > 0;

    return {
      ok,
      details: {
        tenantA: rolesInTenantA,
        tenantB: rolesInTenantB,
        permissionsCount: permissions.length,
      },
    };
  }
}

export function buildHostConfigWithCustomNames(
  adapter: IRbacAdapter,
  models?: Partial<RbacModelsConfig>,
  keys?: Partial<RbacKeysConfig>
): rbacConfig {
  return {
    adapter,
    models,
    keys,
  };
}
