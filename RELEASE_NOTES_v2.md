# Release Notes v2.0.0

## Summary
Version `2.0.0` introduces a cleaner architecture for enterprise multi-tenant RBAC, better customization, and easier integration into existing parent projects.

## What is new
- Adapter-based core architecture:
  - Core services are ORM-agnostic.
  - Database adapters are injected/configured, reducing direct coupling.
- Configurable schema mapping:
  - New `models` config for overriding table/model names.
  - New `keys` config for overriding foreign key names.
- New CLI scaffolding flow:
  - `rbac init` generates model/migration templates from provided names.
  - `rbac validate`, `rbac seed`, and `rbac doctor` improve operational workflows.
- Backward compatibility:
  - Existing users can continue with default model names and migration flow when no custom config is supplied.
- Expanded examples and tests:
  - Standalone MySQL/PostgreSQL/MongoDB examples.
  - Advanced MySQL schema remap example.
  - High automated test coverage with branch threshold enforcement.

## Notes for adopters
- For production, prefer migrations with `sync: false`.
- Use `models` and `keys` only when integrating into an existing schema.
- Parent applications should provide ORM/DB dependencies as needed.

## Breaking/major-change notice
This is a major version because architecture and integration patterns have evolved for flexibility and enterprise readiness. Review configuration and examples before upgrading.
