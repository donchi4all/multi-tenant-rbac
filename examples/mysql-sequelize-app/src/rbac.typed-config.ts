import { rbacConfig } from 'multi-tenant-rbac';

export const typedRbacConfig = {
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
} as const satisfies rbacConfig;
