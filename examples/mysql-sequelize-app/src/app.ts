import MultiTenantRBAC, { Database, rbacConfig } from 'multi-tenant-rbac';

async function bootstrap() {
  // 1) One simple config is enough for SQL integration.
  // The package internally creates and manages Sequelize adapter wiring.
  const config: rbacConfig = {
    sequelizeConfig: {
      dialect: 'mysql',
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT || 3306),
      database: process.env.MYSQL_DATABASE || 'rbac_example1',
      username: process.env.MYSQL_USERNAME || 'root',
      password: process.env.MYSQL_PASSWORD || 'password',
      logging: false,
      sync: true,
    },
  };

  await Database.init(config);
  const rbac = new MultiTenantRBAC(config);

  // 2) createTenant: every tenant is an isolated authorization boundary.
  const tenant = await rbac.createTenant({
    name: 'acme',
    description: 'Acme Inc',
    isActive: true,
  });

  // 3) ensurePermissions/createPermission:
  // seed global permissions used by tenant roles.
  await rbac.ensurePermissions([
    { title: 'write:invoice', description: 'Write invoice', isActive: true },
  ]);
  await rbac.createPermission([
    { title: 'read:invoice', description: 'Read invoice', isActive: true },
  ]);

  // 4) createRole/upsertRole: create tenant-scoped role definitions.
  await rbac.upsertRole(tenant.slug, {
    title: 'auditor',
    description: 'Tenant auditor',
    isActive: true,
  });
  const [role] = await rbac.createRole(tenant.slug, {
    title: 'manager',
    description: 'Tenant manager',
    isActive: true,
  });

  // 5) syncRoleWithPermissions:
  // declaratively replace permissions attached to a role.
  await rbac.syncRoleWithPermissions(tenant.id, {
    role: role.slug,
    permissions: ['read:invoice', 'write:invoice'],
  });

  // 6) assignRoleToUser: grant tenant role to a user identity from parent app.
  await rbac.assignRoleToUser({
    tenantId: tenant.id,
    userId: 'user-100',
    roleSlug: role.slug,
  });

  // 7) authorize: permission check for runtime auth decisions.
  const authorized = await rbac.authorize(tenant.id, 'user-100', 'read:invoice');
  // 8) listEffectivePermissions: load flattened permission set for user.
  const effective = await rbac.listEffectivePermissions(tenant.id, 'user-100');

  // 9) getUserRole/getTenantWithRolesAndPermissions:
  // introspection APIs for admin dashboard & debugging.
  const userRoles = await rbac.getUserRole(tenant.id, 'user-100');
  const tenantGraph = await rbac.getTenantWithRolesAndPermissions(tenant.slug);

  // 10) revokeRoleFromUser: remove assignment cleanly.
  await rbac.revokeRoleFromUser(tenant.id, 'user-100', role.slug);

  console.log({
    tenant: tenant.slug,
    authorized,
    userRoles,
    effectivePermissions: effective.map((p) => p.title),
    tenantRoles: tenantGraph.roles?.map((r) => r.slug),
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
