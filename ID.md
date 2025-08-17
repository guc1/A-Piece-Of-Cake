# ID Scheme

Entity IDs follow `{TypeCode}{SubCode?}{entityId}-{userId}`. Prefixes identify entity type and optional sub-element.

Examples:

- `u53r{userId}` → user record (e.g., `u53r42`).
- `f7avour{flavorId}-{userId}` → flavor owned by a user (e.g., `f7avour12-42`).
- `f7avourde5cr{flavorId}-{userId}` → description field for a flavor (e.g., `f7avourde5cr12-42`).
- `cak3hit-{slug}-{userId}` → cake slice hit area (e.g., `cak3hit-planning-42`).
- `cak3titlePath` → SVG path for the arced title.
- `cak3titleArc` → text element rendering the arced title.
- `n4vbox-{slug}-{userId}` → navigation light box (e.g., `n4vbox-planning-42`).
