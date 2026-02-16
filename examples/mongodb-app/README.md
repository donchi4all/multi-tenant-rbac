# MongoDB Example App

Standalone parent project using `multi-tenant-rbac` with legacy `mongodbConfig` mode.

## Setup

1. `cp .env.example .env` and update values.
2. `npm install`
3. `npm run start`

This example intentionally uses package-level `mongodbConfig` fallback to show backward compatibility.

## Advanced Schema (Custom Collection/Key Names)

Run:

`npm run start:advanced`

This uses `src/app.advanced-schema.ts` and demonstrates:

- custom collection mapping via `models` (`rbac_*_v2`)
- custom relation key names via `keys`

Mongo collections are created lazily when data is inserted; existing collections are not dropped/recreated by this example flow.
