# Update Log

- 2025-08-16: Initial bootstrap with Next.js, Tailwind, shadcn/ui components, guest authentication, Drizzle setup, and Playwright smoke test scaffold.
- 2025-08-16: Added Cake dashboard with radial slice navigation and color tokens.
- 2025-08-16: Fixed authentication helper and added API route for NextAuth.

- 2025-08-17: Replaced auth wrapper with NextAuth factory to fix runtime error.
- 2025-08-17: Switched to getServerSession helper and direct NextAuth route handler to resolve "auth is not a function" error.

## Follow-ups

- [ ] Add OAuth (Google) + DB adapter for NextAuth
- [ ] Implement onboarding for Signature Ethos + Credo
- [ ] Wire flavors UI to DB
- [ ] Add visibility model and guards
- [ ] Add AI coach stub endpoint/action
- 2025-08-18: Added CSS-based 3D cake with animated wedges linked to navigation boxes.
- 2025-08-18: Centered cake layout, added in-slice labels and direct slice navigation with stable IDs.
- 2025-08-18: Repositioned cake higher with responsive offset and optical left nudge; navigation boxes remain centered.
- 2025-08-19: Made navigation boxes compact and added hover-only slice labels driven by separate hoveredSlug state.
- 2025-08-20: Lowered cake for arced title, removed slice labels, added hoveredSlug-driven box pop with reduced-motion support, and rendered responsive "A Piece Of Cake" title arc.
- 2025-08-21: Replaced arc title with centered H1 and reshaped cake into six equal circular slices with seam gaps.
- 2025-08-22: Raised navigation boxes, synced slice hover with box animations, and simplified labels.
- 2025-08-22: Added flavors MVP with sortable list, creation/edit drawer, and API routes.
- 2025-08-23: Replaced flavor drawer with centered modal, added server actions for create/update, autosizing description field, and updated tests.
- 2025-08-24: Persisted user id in NextAuth session to fix "Please sign in" error when saving flavors.
- 2025-08-24: Prevented modal from refocusing on the name field while typing flavor descriptions.
- 2025-08-25: Added email/password authentication with sign-up and login pages and stored flavors in Postgres.
- 2025-08-25: Added migration to add slug to flavors and guarded user ID parsing to prevent NaN queries.
- 2025-08-26: Added subflavors with CRUD UI, server actions, API routes, and navigation button from flavors list.
- 2025-08-26: Added settings button with sign-out, dark mode toggle, follower count display, and profile visibility toggle.
- 2025-08-27: Introduced social "People" pages with follow system, inbox for requests, and profile visibility enforcement.
- 2025-08-27: Fixed sign-up flow to require unique handle, enabling multiple user accounts; updated Playwright tests and added people listing test.
- 2025-08-27: Added account visibility API and settings control; only open accounts are visible in People page.
- 2025-08-27: Validated follower existence in follow action to prevent foreign key errors.
- 2025-08-27: Auto-created missing user records during follow to avoid "User not found" errors.
- 2025-08-27: Reconciled session users with DB via email, preventing duplicate records and hiding self on People page.
- 2025-08-28: Enabled class-based dark mode toggle, added account visibility API route, and sent inbox notifications for auto-accepted follows.
- 2025-08-30: Added followers API, updated settings menu with live follower count, dark mode toggle fix, and link to new account settings page for visibility changes.
- 2025-08-30: Fixed follow visibility and notifications; renamed People page section to "Following" so followed users remain discoverable.
- 2025-08-30: Kept closed-account follows visible, added unfollow notifications, and surfaced them in the inbox.
- 2025-08-30: Enabled follow-back after accepting requests, added decline notifications, and ensured closed accounts appear in Discover.
- 2025-08-30: Fixed profile route params handling and ensured inbox shows follow requests/notifications for all users.
- 2025-08-31: Added profile overview and read-only View Account pages with visibility rules, introduced viewId and view context utilities, and updated People follow states.
- 2025-08-31: Refined View Account to land on Cake home, added viewer bar with Exit, dynamic view routing, and navigation helper.
- 2025-08-31: Added userId query parameter to owner routes and redirect to own account, switching to viewId when viewing others.
- 2025-09-01: Ensured flavor actions create missing user records to avoid foreign key errors when inserting flavors.
