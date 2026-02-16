import MultiTenantRBAC, { Database, rbacConfig } from 'multi-tenant-rbac';

async function bootstrap() {
  const config: rbacConfig = {
    sequelizeConfig: {
      dialect: 'postgres',
      host: process.env.PG_HOST || '127.0.0.1',
      port: Number(process.env.PG_PORT || 5432),
      database: process.env.PG_DATABASE || 'rbac_example',
      username: process.env.PG_USERNAME || 'postgres',
      password: process.env.PG_PASSWORD || 'postgres',
      logging: false,
      sync: true,
    },
    keys: {
      userId: 'adminId',
      roleId: 'roleId',
      permissionId: 'permissionId',
      tenantId: 'workspaceId',
    },
  };

  await Database.init(config);
  const rbac = new MultiTenantRBAC(config);

  const tenant = await rbac.createTenant({
    name: 'workspace-a',
    description: 'Workspace A',
    isActive: true,
  });

  const role = await rbac.upsertRole(tenant.slug, {
    title: 'owner',
    description: 'Workspace owner',
    isActive: true,
  });

  await rbac.createPermission([
    { title: 'manage:workspace', description: 'Manage workspace', isActive: true },
  ]);

  await rbac.grantPermissionsToRole(tenant.id, role.slug, ['manage:workspace']);

  await rbac.assignRoleToUser({
    tenantId: tenant.id,
    userId: 'admin-1',
    roleSlug: role.slug,
  });

  const isAllowed = await rbac.authorize(tenant.id, 'admin-1', 'manage:workspace');
  console.log({ tenant: tenant.slug, isAllowed });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
