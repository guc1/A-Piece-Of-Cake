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

## Profile Viewing

- `pr0ovr-{ownerId}-{viewerId}` → profile overview root container.
- `pr0ovr-view-{ownerId}-{viewerId}` → View Account button in overview.
- `pr0ovr-fol-{ownerId}-{viewerId}` → Follow button in overview.
- `pr0ovr-req-{ownerId}-{viewerId}` → Request to follow button in overview.
- `pr0ovr-unf-{ownerId}-{viewerId}` → Unfollow button in overview.
- `pr0ovr-ccl-{ownerId}-{viewerId}` → Cancel request button in overview.
- `p30pl3-view-{ownerId}-{viewerId}` → View Account quick action in People lists.
- `v13wctx-{ownerId}-{viewerId}` → View Account page root container.
- Section anchors on View Account pages:
  - `v13w-cake-{ownerId}`
  - `v13w-plan-{ownerId}`
  - `v13w-flav-{ownerId}`
  - `v13w-igrd-{ownerId}`
  - `v13w-revw-{ownerId}`
  - `v13w-peep-{ownerId}`
- Viewer bar:
- `v13wbar-{ownerId}-{viewerId}` → viewer bar root container.
- `v13wbar-live-{ownerId}-{viewerId}` → live indicator dot.
- `v13wbar-exit-{ownerId}-{viewerId}` → Exit button.

## Ingredients

- `1ngred-list-{ownerId}` → ingredients list container.
- `1ngred-card-{ingredientId}-{ownerId}` → ingredient card.
- `1ngred-card-img-{ingredientId}-{ownerId}` → card image or initials.
- `1ngred-card-score-{ingredientId}-{ownerId}` → score pill.
- `1ngred-add-{ownerId}` → add ingredient button.
- `1ngred-modal-{ingredientId?}-{ownerId}` → ingredient modal root.
- `1ngred-t1tle-{ingredientId?}-{ownerId}` → title input.
- `1ngred-sh0rt-{ingredientId?}-{ownerId}` → short description input.
- `1ngred-u53-{ingredientId?}-{ownerId}` → usefulness slider.
- `1ngred-de5c-{ingredientId?}-{ownerId}` → description textarea.
- `1ngred-why-{ingredientId?}-{ownerId}` → why used textarea.
- `1ngred-when-{ingredientId?}-{ownerId}` → when used textarea.
- `1ngred-tips-{ingredientId?}-{ownerId}` → tips textarea.
- `1ngred-imgup-{ingredientId?}-{ownerId}` → image upload field.
- `1ngred-vis-{ingredientId?}-{ownerId}` → visibility select.
- `v13w-ingr-ribbon-{ownerId}-{viewerId}` → viewer read-only ribbon.
- `hist-ingr-ribbon-{ownerId}-{date}` → historical snapshot ribbon.
