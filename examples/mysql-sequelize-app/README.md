# MySQL Sequelize Example App

Standalone parent project using `multi-tenant-rbac` with MySQL.

No custom adapter code is needed here. The package builds and uses Sequelize adapter internally from `sequelizeConfig`.

## Setup

1. `cp .env.example .env` and update values.
2. `npm install`
3. `npm run start`

## Advanced Schema (Custom Table/Key Names)

If your parent app already has custom/legacy table names and FK columns, run:

`npm run start:advanced`

This uses `src/app.advanced-schema.ts` and demonstrates:

- `models` remapping:
  - `tenants -> workspaces`
  - `roles -> acl_roles`
  - `permissions -> acl_permissions`
  - `userRoles -> admin_role_links`
  - `rolePermissions -> role_permission_links`
- `keys` remapping:
  - `userId -> adminId`
  - `tenantId -> workspaceId`
  - `roleId -> roleRefId`
  - `permissionId -> permissionRefId`

Use this pattern when integrating RBAC into an existing enterprise schema without renaming your DB tables.

### Troubleshooting

If you get `TenantErrorHandler: Fatal error` on advanced startup, your mapped tenant table likely exists already with incompatible columns.

RBAC expects tenant/role/permission base fields (for example `name`, `slug`, `title`, `isActive`) plus mapped FK keys.  
The advanced example now uses `rbac_*_v2` table names to avoid collisions with legacy tables.

`sync: true` in this package now uses safe sync behavior (`alter: true`, `force: false`) so existing mapped tables are altered for missing columns instead of being dropped/recreated.
