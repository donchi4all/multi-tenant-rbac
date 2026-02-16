import mongoose from 'mongoose';
import MultiTenantRBAC, { Database, rbacConfig } from 'multi-tenant-rbac';

/**
 * Advanced MongoDB example:
 * map RBAC collections/keys to an existing parent-project naming convention.
 */
async function bootstrapAdvancedSchema() {
  const config: rbacConfig = {
    dialect: 'mongodb',
    mongodbConfig: {
      url: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/rbac_example',
      useCreateIndex: true,
      useFindAndModify: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
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
    name: 'mongo-workspace',
    description: 'Mongo advanced schema workspace',
    isActive: true,
  });

  await rbac.ensurePermissions([
    { title: 'profile.read', description: 'Read profile', isActive: true },
    { title: 'profile.manage', description: 'Manage profile', isActive: true },
  ]);

  const role = await rbac.upsertRole(tenant.slug, {
    title: 'profile-admin',
    description: 'Profile admin role',
    isActive: true,
  });

  await rbac.syncRoleWithPermissions(tenant.id, {
    role: role.slug,
    permissions: ['profile.read', 'profile.manage'],
  });

  await rbac.assignRoleToUser({
    tenantId: tenant.id,
    userId: 'mongo-admin-1',
    roleSlug: role.slug,
  });

  const canManage = await rbac.authorize(tenant.id, 'mongo-admin-1', 'profile.manage');
  console.log({ tenant: tenant.slug, role: role.slug, canManage });

  await mongoose.disconnect();
}

bootstrapAdvancedSchema().catch((error) => {
  console.error(error);
  process.exit(1);
});
