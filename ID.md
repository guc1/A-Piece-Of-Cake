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

Modal form IDs:

- `f7avourmdl-{mode}-{userId}` → flavor modal root (`mode`: new|edit).
- `f7avourn4me-frm-{userId}` → flavor form name input.
- `f7avourde5cr-frm-{userId}` → flavor form description textarea.
- `f7avour1mp-frm-{userId}` → flavor form importance slider.
- `f7avourt4rg-frm-{userId}` → flavor form target percentage input.
- `f7avoursav-frm-{userId}` → flavor form save button.
- `f7avourcnl-frm-{userId}` → flavor form cancel button.
- `flavor-modal-title` → flavor modal heading text.
- `subflavor-modal-title` → subflavor modal heading text.

## Cake

- `cak3hit-{slug}-{userId}` → cake slice hit area.
- `cak3seg-{slug}-{userId}` → cake slice segment.
- `n4vbox-{slug}-{userId}` → navigation light box.
- `cak3titleText` → cake page heading text.

## Flavors

- `f7av-add-{ownerId}` → add flavor button.
- `f7avourli5t-{ownerId}` → flavor list container.
- `f7avsubfbtn{flavorId}-{ownerId}` → open subflavors button.
- `f7av-add-own-{ownerId}` → create own flavor option.
- `f7av-add-import-{ownerId}` → import flavor option.
- `f7av-imp-pre-{ownerId}` → choose preset flavor import.
- `f7av-imp-srch-{ownerId}` → search others flavor import.
- `f7av-pr3-{index}-{ownerId}` → preset flavor selection.
- `f7av-ppl-srch-{ownerId}` → search people input.
- `f7av-ppl-{userId}-{ownerId}` → person entry in import search.

## Subflavors

- `s7ubflav-add-{ownerId}` → add subflavor button.
- `s7ubflavourli5t-{ownerId}` → subflavor list container.
- `s7ubflavourrow{subflavorId}-{ownerId}` → subflavor row container.
- `s7ubflavourava{subflavorId}-{ownerId}` → subflavor avatar circle.
- `s7ubflavourn4me{subflavorId}-{ownerId}` → subflavor title text.
- `s7ubflavourde5cr{subflavorId}-{ownerId}` → subflavor description field.
- `s7ubflavoured1t{subflavorId}-{ownerId}` → edit action button.
- `s7ubflavourd3l{subflavorId}-{ownerId}` → delete action button.
- `s7ubflav-add-own-{ownerId}` → create own subflavor option.
- `s7ubflav-add-import-{ownerId}` → import subflavor option.
- `s7ubflav-imp-pre-{ownerId}` → choose preset subflavor import.
- `s7ubflav-imp-srch-{ownerId}` → search others subflavor import.
- `s7ubflav-pr3-{index}-{ownerId}` → preset subflavor selection.
- `s7ubflav-ppl-srch-{ownerId}` → search people input.
- `s7ubflav-ppl-{userId}-{ownerId}` → person entry in import search.
- `s7ubflavourmdl-{mode}-{ownerId}` → subflavor modal root (`mode`: new|edit).
- `s7ubflavourn4me-frm-{ownerId}` → subflavor form name input.
- `s7ubflavourde5cr-frm-{ownerId}` → subflavor form description textarea.
- `s7ubflavour1mp-frm-{ownerId}` → subflavor form importance slider.
- `s7ubflavourt4rg-frm-{ownerId}` → subflavor form target percentage input.
- `s7ubflavourcnl-frm-{ownerId}` → subflavor form cancel button.
- `s7ubflavoursav-frm-{ownerId}` → subflavor form save button.
- `s7ubflavcopy{subflavorId}-{ownerId}` → copy subflavor action in viewer mode.
- `copy-dest` → destination selector when copying subflavors.

## Planning

- `p1an-landing-{ownerId}` → planning landing container.
- `p1an-btn-next-{ownerId}` → Next Day button.
- `p1an-btn-live-{ownerId}` → Live Planning button.
- `p1an-btn-review-{ownerId}` → Review button.
- `p1an-timecol-{ownerId}` → time column container.
- `p1an-vibe-open-{ownerId}` → open general vibe modal.
- `p1an-add-top-{ownerId}` → add block at top button.
- `p1an-range-btn-{ownerId}` → open range selector.
- `p1an-load-early-{ownerId}` → load earlier hours.
- `p1an-load-late-{ownerId}` → load later hours.
- `p1an-close-range-{ownerId}` → close range selector.
- `p1an-hour-{hour}-{ownerId}` → hour slot label.
- `p1an-blk-{blockId}-{ownerId}` → plan block element.
- `p1an-now-{ownerId}` → current time indicator.
- `p1an-add-fab-{ownerId}` → floating add block button.
- `p1an-meta-{blockId}-{ownerId}` → block metadata panel.
- `p1an-meta-good-{blockId}-{ownerId}` → good feedback button.
- `p1an-meta-bad-{blockId}-{ownerId}` → bad feedback button.
- `p1an-meta-close-{ownerId}` → close metadata panel.
- `p1an-meta-ttl-{blockId}-{ownerId}` → metadata title input.
- `p1an-meta-dsc-{blockId}-{ownerId}` → metadata description textarea.
- `p1an-meta-col-{blockId}-{ownerId}` → metadata color input.
- `p1an-meta-tms-{blockId}-{ownerId}` → start time input.
- `p1an-meta-tme-{blockId}-{ownerId}` → end time input.
- `p1an-meta-del-{ownerId}` → delete block button.
- `p1an-meta-igrd-{blockId}-{ownerId}` → ingredient tags container.
- `p1an-meta-igrd-add-{blockId}-{ownerId}` → add ingredient button.
- `p1an-vibe-{ownerId}` → general day vibe modal.
- `p1an-vibe-close-{ownerId}` → close general vibe modal.

## People

- `p30pl3-view-{ownerId}-{viewerId}` → View Account quick action.
- `p30pl3-ccl-{ownerId}-{viewerId}` → Cancel follow request.
- `p30pl3-unf-{ownerId}-{viewerId}` → Unfollow button.
- `p30pl3-fol-{ownerId}-{viewerId}` → Follow button.

## Profile Viewing

- `pr0ovr-{ownerId}-{viewerId}` → profile overview root container.
- `pr0ovr-view-{ownerId}-{viewerId}` → View Account button in overview.
- `pr0ovr-fol-{ownerId}-{viewerId}` → Follow button in overview.
- `pr0ovr-req-{ownerId}-{viewerId}` → Request to follow button in overview.
- `pr0ovr-unf-{ownerId}-{viewerId}` → Unfollow button in overview.
- `pr0ovr-ccl-{ownerId}-{viewerId}` → Cancel request button in overview.
- `v13wctx-{ownerId}-{viewerId}` → View Account page root container.
- Section anchors on View Account pages:
  - `v13w-cake-{ownerId}`
  - `v13w-plan-{ownerId}`
  - `v13w-flav-{ownerId}`
  - `v13w-igrd-{ownerId}`
  - `v13w-revw-{ownerId}`
  - `v13w-peep-{ownerId}`
  - `v13w-subflav-{ownerId}-{flavorId}`
  - `v13w-allsubs-{ownerId}`
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
- `1ngred-vis-{ingredientId?}-{ownerId}` → visibility select.
- `1ngred-add-own-{ownerId}` → create own ingredient option.
- `1ngred-add-import-{ownerId}` → import ingredient option.
- `1ngred-imp-pre-{ownerId}` → choose preset import option.
- `1ngred-imp-srch-{ownerId}` → search others import option.
- `1ngred-pr3-{index}-{ownerId}` → preset selection button.
- `1ngred-ppl-{userId}-{ownerId}` → person entry in import search.
- `igrd-plan-list-{ownerId}` → ingredient picker list when tagging plan blocks.

## History Pages

- `hist-self-plan-review-{ownerId}-{date}` → self snapshot of plan review.
- `hist-self-plan-live-{ownerId}-{date}` → self snapshot of live plan.
- `hist-self-plan-next-{ownerId}-{date}` → self snapshot of next-day plan.
- `hist-self-plan-landing-{ownerId}-{date}` → self snapshot of planning landing.
- `hist-self-cake-{ownerId}-{date}` → self snapshot of cake.
- `hist-plan-review-{ownerId}-{date}` → historical plan review page.
- `hist-plan-live-{ownerId}-{date}` → historical live plan page.
- `hist-plan-next-{ownerId}-{date}` → historical next-day plan page.
- `hist-plan-landing-{ownerId}-{date}` → historical planning landing page.
- `hist-cake-{ownerId}-{date}` → historical cake page.
- `hist-flav-{ownerId}-{date}` → historical flavors page.
- `hist-subflav-{ownerId}-{flavorId}-{date}` → historical subflavors page.
