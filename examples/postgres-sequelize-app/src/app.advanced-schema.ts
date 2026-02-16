import MultiTenantRBAC, { Database, rbacConfig } from 'multi-tenant-rbac';

/**
 * Advanced PostgreSQL example:
 * map RBAC tables/keys to an existing parent-project schema safely.
 */
async function bootstrapAdvancedSchema() {
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
      syncOptions: {
        alter: true,
        force: false,
      },
    },
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
  };

  await Database.init(config);
  const rbac = new MultiTenantRBAC(config);

  const tenant = await rbac.createTenant({
    name: 'pg-workspace',
    description: 'Postgres advanced schema workspace',
    isActive: true,
  });

  await rbac.ensurePermissions([
    { title: 'workspace.read', description: 'Read workspace', isActive: true },
    { title: 'workspace.manage', description: 'Manage workspace', isActive: true },
  ]);

  const role = await rbac.upsertRole(tenant.slug, {
    title: 'workspace-owner',
    description: 'Owner role',
    isActive: true,
  });

  await rbac.syncRoleWithPermissions(tenant.id, {
    role: role.slug,
    permissions: ['workspace.read', 'workspace.manage'],
  });

  await rbac.assignRoleToUser({
    tenantId: tenant.id,
    userId: 'pg-admin-1',
    roleSlug: role.slug,
  });

  const canManage = await rbac.authorize(tenant.id, 'pg-admin-1', 'workspace.manage');
  console.log({ tenant: tenant.slug, role: role.slug, canManage });
}

bootstrapAdvancedSchema().catch((error) => {
  console.error(error);
  process.exit(1);
});
