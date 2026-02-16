import mongoose from 'mongoose';
import MultiTenantRBAC, { Database, rbacConfig } from 'multi-tenant-rbac';

async function bootstrap() {
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
      tenants: 'tenants',
      roles: 'roles',
      permissions: 'permissions',
      userRoles: 'user_roles',
      rolePermissions: 'role_permissions',
      users: 'users',
    },
  };

  await Database.init(config);
  const rbac = new MultiTenantRBAC(config);

  const tenant = await rbac.createTenant({
    name: 'mongo-tenant',
    description: 'Mongo tenant',
    isActive: true,
  });

  await rbac.createPermission([
    { title: 'read:profile', description: 'Read profile', isActive: true },
    { title: 'update:profile', description: 'Update profile', isActive: true },
  ]);

  const role = await rbac.upsertRole(tenant.slug, {
    title: 'editor',
    description: 'Profile editor',
    isActive: true,
  });

  await rbac.syncRoleWithPermissions(tenant.id, {
    role: role.slug,
    permissions: ['read:profile', 'update:profile'],
  });

  await rbac.assignRoleToUser({
    tenantId: tenant.id,
    userId: 'mongo-user-1',
    roleSlug: role.slug,
  });

  const permissions = await rbac.listEffectivePermissions(tenant.id, 'mongo-user-1');
  console.log({ tenant: tenant.slug, permissions: permissions.map((p: any) => p.title) });

  await mongoose.disconnect();
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
