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
