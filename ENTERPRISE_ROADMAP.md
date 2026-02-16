# Enterprise Readiness Roadmap

## v1.3 (Core Hardening)
- [x] Adapter-first architecture with legacy fallback.
- [x] Configurable model names and foreign keys.
- [x] Tenant-aware checks in critical paths.
- [x] Validation utilities and typed validation errors.
- [x] Audit trail emitter (`AuditTrail`).
- [x] Hook system (`hooks`) for lifecycle events.

## v1.4 (Operational Maturity)
- [x] Transaction abstraction in core database layer.
- [x] Transaction wrapping on sync operations.
- [x] CLI doctor/validate/seed commands.
- [x] Cache for effective permission lookups.
- [x] Enterprise helper APIs:
  - `assignRolesToUserBulk`
  - `revokeRoleFromUser`
  - `syncUserRoles`
  - `listEffectivePermissions`
  - `authorize`
  - `upsertRole`
  - `grantPermissionsToRole`
  - `revokePermissionsFromRole`

## v2.0 (Scale + Governance)
- [ ] Adapter contract tests across database providers.
- [ ] Snapshot/event persistence for full audit retention.
- [ ] Policy diff and drift detection on live environments.
- [ ] Benchmark suite and SLO-driven performance tuning.
- [ ] Optional distributed cache and invalidation channel.

## Notes
- Existing integrations using legacy `dialect` config continue to work.
- Parent projects can inject adapters and reuse their existing ORM dependencies.
