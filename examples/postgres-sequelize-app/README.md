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
