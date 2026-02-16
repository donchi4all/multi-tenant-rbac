import MultiTenantRBAC, { Database, rbacConfig } from 'multi-tenant-rbac';

/**
 * Advanced MySQL example:
 * Use existing/legacy table names + foreign-key column names from parent project schema.
 */
async function bootstrapAdvancedSchema() {
  const config: rbacConfig = {
    sequelizeConfig: {
      dialect: 'mysql',
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT || 3306),
      database: process.env.MYSQL_DATABASE || 'rbac_example',
      username: process.env.MYSQL_USERNAME || 'root',
      password: process.env.MYSQL_PASSWORD || 'password',
      logging: false,
      sync: true,
    },
    // Map RBAC entities to existing table names in your parent project.
    // Use distinct names here to avoid clashing with pre-existing tables that
    // may not have required RBAC columns (e.g. name/slug/title/isActive).
    models: {
      users: 'rbac_admins_v2',
      tenants: 'rbac_workspaces_v2',
      roles: 'rbac_acl_roles_v2',
      permissions: 'rbac_acl_permissions_v2',
      userRoles: 'rbac_admin_role_links_v2',
      rolePermissions: 'rbac_role_permission_links_v2',
    },
    // Map relation keys to your existing foreign-key column names.
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
    name: 'enterprise-workspace',
    description: 'Workspace using custom table/key names',
    isActive: true,
  });

  await rbac.ensurePermissions([
    { title: 'invoice.read', description: 'Read invoices', isActive: true },
    { title: 'invoice.manage', description: 'Manage invoices', isActive: true },
  ]);

  const role = await rbac.upsertRole(tenant.slug, {
    title: 'finance-admin',
    description: 'Finance admin role',
    isActive: true,
  });

  await rbac.syncRoleWithPermissions(tenant.id, {
    role: role.slug,
    permissions: ['invoice.read', 'invoice.manage'],
  });

  await rbac.assignRoleToUser({
    tenantId: tenant.id,
    userId: 'admin-42',
    roleSlug: role.slug,
  });

  const canManage = await rbac.authorize(tenant.id, 'admin-42', 'invoice.manage');
  const effective = await rbac.listEffectivePermissions(tenant.id, 'admin-42');

  console.log({
    scenario: 'advanced-schema-remap',
    tenant: tenant.slug,
    role: role.slug,
    canManage,
    effectivePermissions: effective.map((entry) => entry.title),
    mappedModels: config.models,
    mappedKeys: config.keys,
  });
}

bootstrapAdvancedSchema().catch((error) => {
  console.error(error);
  process.exit(1);
});
