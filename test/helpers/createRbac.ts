import MultiTenantRBAC, { Database, InMemoryAdapter, rbacConfig } from '../../src';
import { IRbacAdapter } from '../../src/core/types';

export async function createRbac(
  configOverrides: Partial<rbacConfig> = {},
  adapter?: IRbacAdapter
): Promise<MultiTenantRBAC> {
  const config: rbacConfig = {
    adapter: adapter || new InMemoryAdapter(),
    ...configOverrides,
  };

  await Database.init(config);
  return new MultiTenantRBAC(config);
}
