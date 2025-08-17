# ID Scheme

Entity IDs follow `{TypeCode}{SubCode?}{entityId}-{userId}`. Prefixes identify entity type and optional sub-element.

Examples:
- `u53r{userId}` → user record (e.g., `u53r42`).
- `f7avour{flavorId}-{userId}` → flavor owned by a user (e.g., `f7avour12-42`).
- `f7avourde5cr{flavorId}-{userId}` → description field for a flavor (e.g., `f7avourde5cr12-42`).
- `n4vbox-{slug}-{userId}` → dashboard navigation box (e.g., `n4vbox-planning-42`).
- `cak3seg-{slug}-{userId}` → cake slice group (e.g., `cak3seg-planning-42`).
- `cak3lbl-{slug}-{userId}` → cake slice label (e.g., `cak3lbl-planning-42`).
