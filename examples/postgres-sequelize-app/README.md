# PostgreSQL Sequelize Example App

Standalone parent project using `multi-tenant-rbac` with PostgreSQL.

No custom adapter code is needed here. The package builds and uses Sequelize adapter internally from `sequelizeConfig`.

This sample also shows custom key mapping:
- `userId` -> `adminId`
- `tenantId` -> `workspaceId`

## Setup

1. `cp .env.example .env` and update values.
2. `npm install`
3. `npm run start`

## Advanced Schema (Custom Table/Key Names)

Run:

`npm run start:advanced`

This uses `src/app.advanced-schema.ts` and demonstrates:

- custom `models` table mapping (`rbac_*_v2` tables)
- custom `keys` foreign-key mapping (`adminId`, `workspaceId`, `roleRefId`, `permissionRefId`)
- safe sync behavior (`syncOptions: { alter: true, force: false }`)

If your mapped table already exists with incompatible columns, use a dedicated set of RBAC tables or run generated custom migrations from `rbac init`.
