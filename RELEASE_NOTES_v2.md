# Release Notes v2.x

## Summary
The v2 line modernizes `multi-tenant-rbac` for enterprise integration while keeping backward compatibility for existing users.

## Delivered in v2.0.0
- Adapter-first architecture:
  - Core RBAC logic is ORM-agnostic.
  - Adapters are injected/configured by consumers.
- Configurable schema mapping:
  - `models` overrides for table/collection names.
  - `keys` overrides for FK/relationship column names.
- CLI foundation:
  - `rbac init`, `rbac validate`, `rbac seed`, `rbac doctor`.
- Backward compatibility:
  - Legacy config modes still supported.
- Expanded usage examples and stronger automated tests.

## Delivered in v2.1.0
- Safer SQL sync behavior:
  - `sequelizeConfig.syncOptions` added (`alter`, `force`, `match`).
  - Package defaults for `sync: true` are safer (`alter: true`, `force: false`).
- Better custom-model resolution:
  - Sequelize alias binding prioritizes configured model names.
- Idempotent generated SQL migrations:
  - Custom migrations now create table only if missing.
  - Missing configured columns are added when table already exists.
  - No drop/recreate behavior by default in generated migration `up`.
- Better production diagnostics:
  - Clearer error messages with operation + model + root cause context.
- Example maturity:
  - Advanced schema examples across MySQL, PostgreSQL, and MongoDB.
  - Standard + advanced run scripts for easier onboarding.

## Scope Clarification
This package provides:
- multi-tenant RBAC domain operations
- adapter contracts and default adapter implementations
- optional CLI scaffolding/validation utilities

This package does not replace:
- full application data modeling outside RBAC entities
- parent app deployment, secrets, or runtime orchestration
- organization-specific policy engines (can be layered on top)

## Upgrade Notes
- Prefer migrations (`sync: false`) in production.
- Use `rbac init` + generated migrations when using custom `models`/`keys`.
- Keep package build artifacts fresh before publish (`npm run build`).
