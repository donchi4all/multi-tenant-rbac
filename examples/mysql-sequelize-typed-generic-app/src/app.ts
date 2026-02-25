import { createTypedRBAC, Database } from 'multi-tenant-rbac';
import { typedRbacConfig } from './rbac.typed-config';

async function bootstrapTypedGenericApp() {
  await Database.init(typedRbacConfig);
  const rbac = createTypedRBAC(typedRbacConfig);

  const tenant = await rbac.createTenant({
    name: 'typed-generic-example',
    description: 'Typed generic parent-project integration',
    isActive: true,
  });
  const workspaceId = String(tenant.id);

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
    workspaceId,
    adminId: 'admin-typed-100',
    roleSlug: role.slug,
  });

  const allowed = await rbac.authorize({
    workspaceId,
    adminId: 'admin-typed-100',
    permission: 'invoice.manage',
  });

  const effectivePermissions = await rbac.listEffectivePermissions({
    workspaceId,
    adminId: 'admin-typed-100',
  });

  console.log({
    allowed,
    effective: effectivePermissions.map((entry) => entry.title),
    typedConfig: rbac.typedConfig,
  });
}

bootstrapTypedGenericApp().catch((error) => {
  console.error(error);
  process.exit(1);
});
