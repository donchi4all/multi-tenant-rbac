# Multi-Tenant RBAC v2.1

`multi-tenant-rbac` is a production-focused, multi-tenant authorization package for Node.js and TypeScript.

## Why multi-tenant-rbac?

Most RBAC libraries:

- are not tenant-aware
- assume single-tenant apps
- are tightly coupled to one ORM
- don’t support schema remapping
- break in enterprise SaaS environments

multi-tenant-rbac solves this by:

- strict tenant isolation
- adapter-based architecture
- schema remapping support
- CLI scaffolding
- production-ready migration flow

## Core Capabilities

It provides:

- tenant-scoped roles and permissions
- adapter-based data access (core is ORM-agnostic)
- configurable model/table names and foreign-key names
- easy startup for MySQL, PostgreSQL, and MongoDB setups

## What changed in 2.x

- Introduced adapter-based architecture so core logic is ORM-agnostic.
- Added `models` config to override default model/table names.
- Added `keys` config to override default foreign-key names.
- Added `rbac init` and expanded CLI flows for scaffolding and validation.
- Preserved backward compatibility with default names and legacy config paths.

For full details, see [`RELEASE_NOTES_v2.md`](./RELEASE_NOTES_v2.md).

## Install

```bash
npm install multi-tenant-rbac
```

## Who Provides DB Dependencies?

This package keeps core dependencies light.

- You provide database/ORM dependencies in your parent app (for example `sequelize`, `mysql2`, `mongoose`) when needed.
- Core RBAC logic does not hard-depend on Sequelize or Mongoose.

## Quick Start (Sequelize)

```ts
import MultiTenantRBAC, { Database, rbacConfig } from 'multi-tenant-rbac';

const config: rbacConfig = {
  sequelizeConfig: {
    dialect: 'mysql', // mysql | postgres | mariadb | sqlite | mssql
    host: '127.0.0.1', // DB host
    port: 3306, // DB port
    database: 'rbac_db', // DB name
    username: 'root', // DB username
    password: 'password', // DB password
    logging: false, // set true (or logger fn) to see SQL queries
    sync: true, // dev only; prefer migrations in production
  },
};

await Database.init(config);
const rbac = new MultiTenantRBAC(config);
```

## Advanced Existing-Schema Setup (Custom Tables + Keys)

Use this when your parent app already has different table names and FK fields.

```ts
import MultiTenantRBAC, { Database, rbacConfig } from 'multi-tenant-rbac';

const config: rbacConfig = {
  sequelizeConfig: {
    dialect: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    database: 'rbac_db',
    username: 'root',
    password: 'password',
    logging: false,
    sync: true, // auto-sync Sequelize models
    syncOptions: {
      alter: true, // add missing columns safely
      force: false, // never drop/recreate tables
    },
  },
  models: {
    users: 'admins',
    tenants: 'workspaces',
    roles: 'acl_roles',
    permissions: 'acl_permissions',
    userRoles: 'admin_role_links',
    rolePermissions: 'role_permission_links',
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
```

Defaults are used automatically for any `models` or `keys` values you do not provide.

## Config Options (Easy Guide)

- `sequelizeConfig`: SQL connection/runtime options used by the built-in Sequelize adapter.
- `models`: overrides default RBAC table/collection names.
- `keys`: overrides default relation key names (`userId`, `tenantId`, `roleId`, `permissionId`).
- `sync`: useful for local development; in production prefer migrations.
- `syncOptions.alter`: adds missing columns without dropping tables.
- `syncOptions.force`: drops/recreates tables; keep `false` for safety.

Default names (used when you do not override):

- models: `users`, `tenants`, `roles`, `permissions`, `user_roles`, `role_permissions`
- keys: `userId`, `tenantId`, `roleId`, `permissionId`

## Most Important Methods

### Bootstrap and structure

- `createTenant`
- `createRole` / `upsertRole`
- `createPermission` / `ensurePermissions`

### Permission mapping

- `syncRoleWithPermissions`
- `grantPermissionsToRole`
- `revokePermissionsFromRole`

### User assignment

- `assignRoleToUser`
- `assignRolesToUserBulk`
- `syncUserRoles`
- `revokeRoleFromUser`

### Authorization checks

- `authorize`
- `userHasPermission`
- `listEffectivePermissions`

## Example End-to-End Flow

```ts
const tenant = await rbac.createTenant({
  name: 'acme',
  description: 'Acme Inc',
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
  userId: 'user-100',
  roleSlug: role.slug,
});

const allowed = await rbac.authorize(tenant.id, 'user-100', 'invoice.manage');
console.log({ allowed });
```

## CLI

### Generate RBAC models and migrations

```bash
rbac init --orm sequelize --out ./rbac-generated
```

### With custom names

```bash
rbac init \
  --orm sequelize \
  --models users=admins,roles=acl_roles,permissions=acl_permissions,userRoles=admin_role_links,rolePermissions=role_permission_links \
  --keys userId=adminId,roleId=roleRefId,permissionId=permissionRefId,tenantId=workspaceId
```

### Other commands

```bash
rbac validate --manifest ./rbac-generated/rbac.init.json
rbac seed --out ./rbac.seed.json
rbac doctor --out ./rbac.doctor.json
```

## Migrations (Default)

Existing users can continue using default migrations when not configuring custom names:

```bash
node ./node_modules/.bin/sequelize-cli db:migrate \
  --url mysql://root:password@localhost:3306/lib_rbac \
  --migrations-path ./node_modules/multi-tenant-rbac/src/migrations
```

If you provide custom `models` and/or `keys`, generate custom migrations and run those instead of package defaults:

```bash
rbac init --orm sequelize --out ./rbac-generated --models ... --keys ...
node ./node_modules/.bin/sequelize-cli db:migrate --migrations-path ./rbac-generated/sequelize/migrations
```

Generated SQL migrations are idempotent:

- create table only when missing
- add missing configured columns when table already exists
- never drop/recreate by default

## Standalone Integration Examples

- `examples/mysql-sequelize-app`
- `examples/postgres-sequelize-app`
- `examples/mongodb-app`

## Production Notes

- Prefer `sync: false` in production and use migrations.
- Use structured logging for SQL if needed: `logging: (sql) => logger.debug(sql)`.
- Keep tenant boundaries strict in every service call.

## Contributing

Contributions are welcome.

If you want to contribute, please:

1. Open an issue with your proposal or bug report.
2. Submit a PR with tests.
3. For major changes, discuss design first.

Reach out here:

- Issues: `https://github.com/donchi4all/multi-tenant-rbac/issues`
- Repository: `https://github.com/donchi4all/multi-tenant-rbac`

If you want to collaborate directly on enterprise features, please open an issue titled: `Collaboration Request`.

## License

MIT
