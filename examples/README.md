# Standalone Integration Examples

Each folder here is a standalone parent project that integrates `multi-tenant-rbac`.

## Projects

1. `mysql-sequelize-app`
- Parent DB: MySQL
- Parent ORM: Sequelize
- RBAC integration mode: `sequelizeConfig` (no custom adapter code)

2. `postgres-sequelize-app`
- Parent DB: PostgreSQL
- Parent ORM: Sequelize
- RBAC integration mode: `sequelizeConfig` (no custom adapter code)
- Includes custom key mapping example (`userId -> adminId`, `tenantId -> workspaceId`)

3. `mongodb-app`
- Parent DB: MongoDB
- RBAC integration mode: legacy `mongodbConfig` fallback

4. `mysql-sequelize-typed-generic-app`
- Parent DB: MySQL
- Parent ORM: Sequelize
- RBAC integration mode: typed generic (`createTypedRBAC`)
- Includes one-command migration generation via CLI auto-detection (`rbac init --out ...`)

## How to run any project

1. `cd examples/<project-name>`
2. `cp .env.example .env`
3. install dependencies: `npm install`
4. set env vars from `.env` in your shell (or use your own env loader)
5. run: `npm run start`

## Advanced runs

- MySQL: `npm run start:advanced`
- PostgreSQL: `npm run start:advanced`
- MongoDB: `npm run start:advanced`
- Typed generic MySQL: `cd examples/mysql-sequelize-typed-generic-app && npx rbac init --out ./rbac-generated && npm run start`
