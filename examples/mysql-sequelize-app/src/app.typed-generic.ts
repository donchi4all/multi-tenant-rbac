import { createTypedRBAC, Database } from 'multi-tenant-rbac';
import { typedRbacConfig } from './rbac.typed-config';

async function bootstrapTypedGeneric() {
  const config = typedRbacConfig;

  await Database.init(config);
  const rbac = createTypedRBAC(config);

  const tenant = await rbac.createTenant({
    name: 'typed-workspace',
    description: 'Compile-time typed key mapping',
    isActive: true,
  });
  const tenantId = String(tenant.id);

  await rbac.ensurePermissions([
    { title: 'invoice.read', description: 'Read invoices', isActive: true },
  ]);

  const role = await rbac.upsertRole(tenant.slug, {
    title: 'typed-admin',
    description: 'Typed role',
    isActive: true,
  });

  await rbac.syncRoleWithPermissions(tenant.id, {
    role: role.slug,
    permissions: ['invoice.read'],
  });

  await rbac.assignRoleToUser({
    workspaceId: tenantId,
    adminId: 'admin-typed-1',
    roleSlug: role.slug,
  });

  await rbac.assignRolesToUserBulkAdvanced({
    workspaceId: tenantId,
    adminId: 'admin-typed-1',
    roleSlugs: [role.slug],
  });

  await rbac.syncUserRolesAdvanced({
    workspaceId: tenantId,
    adminId: 'admin-typed-1',
    roleSlugs: [role.slug],
  });

  const allowed = await rbac.authorize({
    workspaceId: tenantId,
    adminId: 'admin-typed-1',
    permission: 'invoice.read',
  });

  const roleView = await rbac.getUserRole({
    workspaceId: tenantId,
    adminId: 'admin-typed-1',
  });

  const hasPermission = await rbac.userHasPermissionAdvanced({
    workspaceId: tenantId,
    adminId: 'admin-typed-1',
    permission: 'invoice.read',
  });

  const usersWithRole = await rbac.findUserByRoleAdvanced({
    workspaceId: tenantId,
    roleSlug: role.slug,
  });

  console.log({
    typedConfig: rbac.typedConfig,
    allowed,
    hasPermission,
    roleCount: roleView.roles.length,
    usersWithRoleCount: usersWithRole.length,
    advancedUserKey: roleView.adminId,
  });
}

bootstrapTypedGeneric().catch((error) => {
  console.error(error);
  process.exit(1);
});
