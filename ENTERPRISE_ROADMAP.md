# Enterprise Readiness Roadmap

## Package Scope
- Multi-tenant RBAC domain operations (tenant, role, permission, assignment, authorization).
- Adapter-driven persistence (ORM-agnostic core).
- Optional CLI scaffolding and operational utilities.
- Backward-compatible migration path for existing integrations.

## Completed (v2.0 - v2.1)
- [x] Adapter-first architecture with legacy fallback support.
- [x] Configurable `models` and `keys`.
- [x] Validation, hooks, and audit emitters.
- [x] Transaction abstraction in database module.
- [x] Enterprise helper APIs:
  - `assignRolesToUserBulk`
  - `revokeRoleFromUser`
  - `syncUserRoles`
  - `listEffectivePermissions`
  - `authorize`
  - `upsertRole`
  - `grantPermissionsToRole`
  - `revokePermissionsFromRole`
- [x] CLI utilities:
  - `rbac init`
  - `rbac validate`
  - `rbac seed`
  - `rbac doctor`
- [x] Safer sync controls with `sequelizeConfig.syncOptions`.
- [x] Idempotent generated SQL migrations for custom schema setups.
- [x] Improved runtime errors with operation/model/root-cause context.
- [x] Standalone examples for MySQL, PostgreSQL, and MongoDB (standard + advanced flows).

## Next Phase (v2.2)
- [ ] Adapter conformance test matrix (shared contract tests).
- [ ] CLI `init` templates for stricter SQL column typing and index hints.
- [ ] First-class migration docs for custom schema adoption path.
- [ ] Optional structured logger injection for SQL and authorization traces.
- [ ] Better CLI diagnostics output for common integration mistakes.

## Scale + Governance (v3.0)
- [ ] Persisted audit pipeline (optional storage backends).
- [ ] Policy drift detection and config diff tooling.
- [ ] Optional distributed permission cache invalidation channel.
- [ ] Performance benchmark suite and recommended SLO targets.
- [ ] Versioned policy bundles for controlled rollout.

## Adoption Notes
- Existing integrations using legacy `dialect` config continue to work.
- Parent projects can inject adapters and reuse existing ORM dependencies.
- For production, prefer migrations over runtime sync where possible.
