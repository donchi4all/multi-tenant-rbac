# MySQL Sequelize Typed-Generic Example

Standalone parent project showing typed-generic RBAC usage and automatic CLI mapping detection.

## Setup

1. `cp .env.example .env`
2. `npm install`

Check installation/CLI detection:

`npm run rbac:doctor`

## Generate migrations with one command

`npm run rbac:init`

The CLI auto-detects `models` and `keys` from `src/rbac.typed-config.ts` and generates:

- `./rbac-generated/rbac.init.json`
- `./rbac-generated/sequelize/models`
- `./rbac-generated/sequelize/migrations`

Validate:

`npm run rbac:validate`

Run full local smoke test:

`npm run test:all-round`

## Run typed app

`npm run start`
