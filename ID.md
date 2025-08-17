# ID Scheme

Entity IDs follow `{TypeCode}{SubCode?}{entityId}-{userId}`. Prefixes identify entity type and optional sub-element.

Examples:

- `u53r{userId}` → user record (e.g., `u53r42`).
- `f7avour{flavorId}-{userId}` → flavor owned by a user (e.g., `f7avour12-42`).
- `f7avourde5cr{flavorId}-{userId}` → description field for a flavor (e.g., `f7avourde5cr12-42`).
- `f7avourrow{flavorId}-{userId}` → flavor row container.
- `f7avourava{flavorId}-{userId}` → flavor avatar circle.
- `f7avourn4me{flavorId}-{userId}` → flavor title text.
- `f7avour1mp{flavorId}-{userId}` → importance slider input.
- `f7avourt4rg{flavorId}-{userId}` → target percentage input.
- `f7avoured1t{flavorId}-{userId}` → edit action button.
- `f7avourd3l{flavorId}-{userId}` → delete action button.
- `cak3hit-{slug}-{userId}` → cake slice hit area (e.g., `cak3hit-planning-42`).
- `cak3seg-{slug}-{userId}` → cake slice segment (e.g., `cak3seg-planning-42`).
- `n4vbox-{slug}-{userId}` → navigation light box (e.g., `n4vbox-planning-42`).
- `cak3titleText` → page heading text.

Modal form IDs:
- `f7avourmdl-{mode}-{userId}` → flavor modal root (`mode`: new|edit).
- `f7avourn4me-frm-{userId}` → flavor form name input.
- `f7avourde5cr-frm-{userId}` → flavor form description textarea.
- `f7avour1mp-frm-{userId}` → flavor form importance slider.
- `f7avourt4rg-frm-{userId}` → flavor form target percentage input.
- `f7avoursav-frm-{userId}` → flavor form save button.
- `f7avourcnl-frm-{userId}` → flavor form cancel button.
