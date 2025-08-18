A Piece of Cake – Agent Guidelines
Tech Stack Overview
Framework: Next.js (App Router, React 19)


Language: TypeScript


Package Manager: pnpm


Database: PostgreSQL with Drizzle ORM (Neon)


Authentication: NextAuth.js (credentials, Google OAuth, guest login)


Styling: Tailwind CSS with shadcn/ui (Radix UI for accessibility)


Testing: Playwright (end-to-end testing; uses Docker services for DB/Redis)


Payments: Stripe (for any premium features, subscriptions if asked for)


Observability: OpenTelemetry (@vercel/otel) for monitoring


AI Integration: Vercel AI SDK 


Project Philosophy and Features 
“A Piece of Cake” is a motivation and life-planning platform built around the cake metaphor. The core idea is that a user’s life goals and values form a “cake,” made up of various Flavors, Sub-flavors, and supported by actionable Ingredients (habits/rules). The app leverages AI agents to help users plan and reflect on their daily activities in alignment with their life “cake.”
Flavors: High-level life domains or values (e.g. Health, Career, Relationships). Users define their own flavors with custom names, descriptions, and importance levels (0-100). These represent what they want their “cake” (life) to taste like.


Sub-flavors: Subcategories or specific initiatives under each flavor. For example, under Health (a flavor), one might have sub-flavors like Cardio Endurance, Nutrition, Mental Wellness. These break a domain into focused areas.


Ingredients: Concrete habits, rules or tools the user uses to make progress in flavors. Ingredients are like life hacks or protocols (e.g. “No screens after 10pm” or “Morning gym sessions Mon/Wed/Fri”). Users can create ingredients with tips and notes, rate their usefulness (0-100), and attach them to plans.


Planning: Users create a daily plan, broken into time blocks with activities. Each activity can be tagged with a Flavor (and Sub-flavor) it contributes to, and Ingredients used. There are three planning modes:


Plan Next Day: Draft tomorrow’s schedule with intended activities.


Live Planning: View today’s plan in real-time (with an agent available to assist if plans change or motivation is needed).


Review Today’s Plan: At day’s end, mark what was done, give feedback on each activity (what went well, what to improve, how the ingredients helped).


Review & Reflection: Users maintain two types of “purpose” statements:


Declared Purpose: what they say they want (their rational goals and their “secret” motivations). This is the user’s description of their ultimate cake (life philosophy or purpose – we may call this their Signature Ethos in the UI).


Revealed Purpose: what the system infers from their actions. An AI agent will analyze the user’s recent activities and flavors to articulate what it seems the user is prioritizing.


The app then provides an “Ethos Coherence” or alignment score between Declared and Revealed purpose, highlighting gaps and suggesting focus areas.


Social, Open-by-Default: The platform is built as a community. Every user’s profile can be viewed by other users (by default all content is public to other logged-in users, unless the owner restricts it in Visibility settings). This means users can inspect and learn from each other’s flavors, ingredients, plans, and reviews:


Users can share their Flavors, Sub-flavors, and Ingredients. There is a preset library where you can publish a flavor or ingredient for others to copy (fork) into their own profile.


There is a social page (“Other People”) where you can search or browse users. You’ll see those you follow, your friends (mutual follows), and recommended profiles.


Visiting another’s profile shows a read-only view of their Cake: their flavors, sub-flavors, ingredients, and possibly recent plans or signature ethos (depending on privacy settings).


An AI Profile Assistant can answer questions about someone’s public profile (e.g., “What is @alice focusing on lately?”), while respecting privacy rules (it won’t reveal anything marked private).


Visibility & Privacy: Users can control, for each piece of content (each flavor, ingredient, review note, etc.), who can see it:


Options include Public (any logged-in user), Followers only, Friends only, or Private (only the user themselves).


The app provides a Visibility settings overview where users can toggle the visibility of each category of content. By default, most content is public to encourage sharing, but users have full control to hide things they consider sensitive.


Overall Philosophy: The goal is to help users align their daily actions with their long-term values in a positive, non-judgmental way. The app should always emphasize positive contributions of any action (no shaming for “bad” actions, instead reframe as “this fulfilled your social flavor but maybe overfilled it if it harms another area”). The AI agents play the role of an objective coach or personal guide, giving feedback and suggestions based on the user’s own defined goals.
IMPORTANT: this is the vision of the app, when updating the codebase based on the request of the user, do what the user asks, but keep the app's philosophy in mind, so the feature is designed in such a way it can be made compatible in the future with all the features that are displayed here 
Design Philosophy
Modern & Minimalist, with a Dopamine Kick: The design draws inspiration from the clean aesthetics of OpenAI and Apple’s UIs – lots of white (or dark) space, simple typography, and intuitive layouts – but we also incorporate delightful elements that give a dopamine rush. This might include vibrant accent colors (an “energizing orange” theme), satisfying micro-interactions, and celebratory effects (for example, a subtle animation or confetti when a user completes their daily review).
especially the colours and moving things have to be always included, and they have to be designed in such a way it gives max dopamine to the user (this for long term retention on the website). BUT DON”T MAKE IT OVER THE TOP, keep it minimalistic yet there.


“Jony Ive on Acid” Creativity: We strive for a balance between professional polish and creative flair. The interface should feel logical and calm at its core (so as not to overwhelm or confuse), yet contain unexpected playful touches that inspire users. Think of standard Apple design principles (clarity, depth, deference to content) infused with bursts of color or animated feedback to make achievements feel rewarding. The agent has flexibility to propose novel UI ideas (unique layouts, animations) as long as they enhance user experience and remain consistent with the overall style.


Logical Layout & UX: Navigation is straightforward. From the home “Cake” dashboard, the user can reach all main sections (Planning, Flavors, Ingredients, Review, Others’ Profiles) in one or two clicks. Content within each page is organized intuitively:


Planning pages use timelines or calendar visuals with clear markers for current time and completed vs upcoming tasks.


Flavors/Sub-flavors pages use cards or lists with icons and importance meters.


Ingredient pages emphasize sorting by usefulness and show user-contributed tips.


Review pages use readable question prompts and text boxes to encourage reflection.


Profile pages (self and others) present a high-level “Cake” summary (maybe a pie chart of time spent per flavor, etc.) and sections for each type of content.


Theming: We support multiple themes. “Light” and “Dark” are standart. make all features both light and dark modus ready.. The theme primarily affects colors and perhaps font weight choices. The design is responsive and consistent across devices. Components from shadcn/ui ensure we have a coherent look and feel with Tailwind CSS utility theming.


Accessibility & Clarity: Design elements are not only aesthetically pleasing but also accessible. We use Radix UI primitives (via shadcn components) to ensure proper focus handling, ARIA labels, and screen-reader-friendly markup. High contrast modes and reduced motion settings should be available for those who need them. Animations and effects should be subtle by default (no flashing or painful colors) – the aim is to uplift, not distract.


Localization: The app is built with internationalization in mind. All user-facing text is externalized (e.g., using i18n JSON files). English (en) and Dutch (nl) are planned as supported languages initially, as noted in the tech stack. The design should accommodate different text lengths for different languages (e.g., buttons should be flexible for longer Dutch phrases). design the things in such a way so they could easily be replaced by another language. → choose for variables instead of hard coded text. 
Project Structure
This section outlines how the codebase is organized, so the coding agent understands where to put new code and how things relate:
Monorepo: (if applicable) – At this stage, we anticipate a single Next.js project. If a apps/ or packages/ directory appears, Agents.md will be updated. For now, assume a standard Next.js app structure.


app/ Directory (Next.js App Router): The Next.js App Router is in use, meaning most pages and API endpoints are defined as React Server Components or Route Handlers in app/. Key subfolders:


app/(auth)/ – Contains NextAuth pages and route handlers for authentication (e.g., signin, callback routes). Configured via .../auth.ts with providers (credentials, Google, etc.).


app/dashboard/ – Protected area after login, contains the main sections:


planning/ (and sub-routes for live, next-day, review),


flavors/ (list, create, edit flavors),


ingredients/,


review/ (for weekly/monthly reflections perhaps),


people/ (social browsing).


Each of these might use nested layouts or shared UI where appropriate (e.g., a common dashboard navbar).


app/api/ – Route handlers for any server-side actions not covered by server components. This may include REST endpoints for things like saving a plan, or webhooks (e.g., app/api/stripe/webhook for payment events).


components/ Directory: Reusable React components live here. Examples:


components/ui/ – could mirror shadcn/ui structure for any custom-styled components or wrappers (buttons, dialogs, etc.).


components/agents/ – components related to AI agent interface (chat windows, assistant responses).


components/[feature]/ – feature-specific components, e.g., PlanningCalendar.tsx, FlavorCard.tsx, IngredientListItem.tsx.


lib/ Directory: Modules for config and utilities:


lib/ai.ts or lib/ai/* – Setup for the AI SDK (e.g., defining available models, functions that invoke LLM with proper parameters, context assembly logic for agent prompts).


lib/db.ts – Drizzle ORM initialization (connecting to Neon Postgres with provided URL, etc.). Also, define schemas (which might live in lib/db/schema.ts or a schema/ folder) for Flavors, Ingredients, Users, Plans, etc.


lib/auth.ts – NextAuth configuration helpers (if not directly in [...nextauth].ts).


lib/utils.ts – General utility functions (date formatting, unique ID generation for our IDs, etc.).


lib/validation.ts – Zod schemas or similar for request validation (to reuse between front-end and API).


Styling: Tailwind CSS is used with a custom config (tailwind.config.ts). We use Shadcn UI components which come pre-styled with Radix and Tailwind. All custom styles should be in the form of Tailwind classes or, rarely, CSS modules if needed. Global styles (if any) might reside in app/globals.css for base resets or CSS variables for themes.


State Management: Wherever possible, use React’s built-in features (server components, useState/useEffect) or small context providers. If a global state solution is needed for complex interactions, we will consider something like Zustand or Context API. (Agents.md will be updated if such a library is introduced.)


Database Schema & ORM: We use Drizzle ORM for type-safe database access. The schema is defined in TypeScript (possibly under lib/db/schema.ts or a drizzle/ folder). For any new model (table), define it via Drizzle’s schema utilities and run a migration. The agent should generate migrations if it creates/changes schema (we’ll likely use Drizzle’s migrations generation).


Example tables: User, Flavor, SubFlavor (with foreign key to Flavor or to User if independent), Ingredient, PlanEntry, etc., each with appropriate fields and relations.


Use Drizzle query builders for complex queries. Avoid raw SQL unless necessary, and if so, ensure to parameterize inputs.


API and Server Actions: Many form submissions will utilize Server Actions (Next.js 13.4+ feature) where possible for simplicity (they allow directly calling server functions from components). For example, a form to create a Flavor might call an async function createFlavor(data) { ... } marked with "use server".


Use Next.js built-in protection on server actions to ensure only authorized calls (they carry the user’s cookie session).


For APIs that need to be called client-side or by third parties (e.g., mobile app or webhook endpoints), use route handlers under app/api/*. Protect them with authentication where needed (checking currentUser or session).


Testing: Playwright is set up for end-to-end tests. We have a tests/ directory with spec files (e.g., tests/onboarding.spec.ts for testing the onboarding flow, etc.). The agent should update or add tests when implementing new features:


Before running tests, ensure the required services are running (use docker-compose.dev.yml to start Postgres, Redis if used, etc.). The agent can assume a local dev environment with these up.


Write tests for critical flows (registration, login, creating a plan, etc.). Aim for Playwright tests that simulate user behavior in the browser.


Unit tests: If we introduce logic heavy modules (e.g., a scheduling algorithm), we may add Jest or Vitest for unit tests. (This is not set up yet; if needed, mention in Agents.md when added.)


Running & Dev Workflow: To run the app locally, developers/agents will:


Copy .env.example to .env and fill in secrets (database URL, NextAuth secret, API keys, etc.). (Do not commit the .env filegithub.com.)


Install packages: pnpm install


Migrate or seed database as needed (e.g., a script or drizzle migration).


Start dev server: pnpm dev (Next.js runs on localhost:3000).


Run pnpm test to execute Playwright tests (ensure the test services are running).


Deployment: Eventually, we target Vercel deployment for the front-end (Next.js) and Neon for the database. Stripe webhooks will be configured with a Vercel function. Agents should keep deployment in mind (use environment variables, avoid local file writes except via Vercel Blob or a similar service for persistence).


Security and Best Practices
Security is the top priority. Every code change must consider the security impact. The agent should proactively include security measures, even if not explicitly mentioned in the task:
Input Validation & Sanitization: All external input must be validated and sanitized. This includes user form data, query parameters, and any third-party data. Use appropriate validation libraries (e.g., Zod schemas for structure, built-in validation for HTML inputs). Prevent common vulnerabilities:


XSS: Never directly inject user-provided strings into the DOM without escaping. In React, data binding is generally safe, but beware of dangerouslySetInnerHTML (avoid it or ensure content is sanitized).


SQL Injection: When using Drizzle or parameterized queries, we are safe by default (no string concatenation for queries). Do not construct raw SQL with user input.


Command Injection/Deserialization: (Likely not applicable in a Next.js context, but if operating on server with file or shell commands, never use unsanitized input.)


Authentication & Authorization: Leverage NextAuth for authentication – it provides session cookies and useSession() hook or getServerSession for server-side. Always check session on server actions and API routes:


Pages under app/dashboard/** should require an authenticated user. We will likely add a route segment config or middleware to protect these routes.


Authorization: Ensure users can only access/modify their own Flavors, Ingredients, Plans, etc. For example, if a request comes to update a flavor, verify the flavor belongs to session.user.id.


For any data that is potentially visible to others, apply the visibility rules. The agent should implement checks so that if user A tries to view user B’s content, it respects the privacy setting (e.g., if B marked it friends-only and A isn’t a friend, the API should not return it).


Handling Secrets: No secret API keys or credentials are ever to be committed in the code. Use environment variables for keys (OpenAI API Key, xAI key, Stripe secret, NextAuth secrets, etc.). The .env.example file documents all needed env vars so developers know what to set. If the agent creates a feature that needs a new secret (e.g., new third-party API), add a placeholder in .env.example but do not put any real key.


Encryption & Data Protection: Passwords (if using credentials auth) must be hashed (e.g., using bcrypt) before storing in the database. Use SSL/TLS for all external requests. Store sensitive data (if any) securely – however, ideally we avoid storing any PII beyond what’s necessary (perhaps email for account, and user content which is mostly not highly sensitive).


Audit & Logging: Maintain server logs for important security-related events (login attempts, errors, permission denials) using Next.js middleware or API route logic. Do not log sensitive info (like passwords or tokens) but do log actions like “User X attempted to access User Y’s ingredient and was denied”.


Dependency Best Practices: Be mindful when adding new npm packages. Stick to popular, well-maintained libraries. Check for known vulnerabilities (e.g., pnpm audit). Remove or update packages that raise security flags. For example, if a rich text editor is introduced for descriptions, ensure it’s configured to prevent script injection.


Testing & QA: Our Playwright test suite should include some security-oriented tests, e.g., XSS injection attempts to ensure they get escaped. The agent can simulate entering <script> tags in a form and confirm that the output is safe (no script executes, often by checking the text is literally shown or stripped).


Performance and DoS considerations: Ensure that no single request can overburden the server (e.g., infinite loops, unbounded data fetch). Use pagination or limits on any list queries (like don’t fetch a million records at once). If generating AI responses, put reasonable limits (like max tokens for LLM, or timeouts) to avoid misuse.


Stripe & Webhook Security: When integrating Stripe, verify webhook signatures (Stripe provides a signing secret). Do not trust incoming webhook data blindly. Only grant minimum required permissions to Stripe API keys.


By embedding these security practices, we aim to build a robust and trustworthy application. The coding agent should internalize these and default to secure patterns (e.g., always escaping output, always checking user identity on protected actions, etc.) without needing explicit instruction each time
Unique ID Conventions (Data & UI IDs)
To facilitate interactions between components and AI agents, we have a systematic ID notation for entities and key UI elements. All IDs are documented in a separate file ID.md. The coding agent must assign IDs following this scheme and update ID.md whenever a new ID type is introduced.
Purpose of IDs: These IDs uniquely identify items (Flavors, Ingredients, etc.) and even specific sub-elements (like a description field or a save button). They will be used in code (for element id attributes, keys, or test selectors) and in AI agent prompts to fetch or reference specific context. The format is designed to be both human-recognizable and machine-parsable.


General Format: {TypeCode}{SubCode(optional)}{EntityID}{UserID}.


TypeCode: a short string (letters and possibly numbers) that identifies the entity type (e.g., flavor, ingredient, user).


SubCode (optional): a code for a sub-component or related element.


EntityID: the identifier of the specific entity instance (often a number from the database or a slug).


UserID: the identifier of the user owner. This is included for entities that belong to a user (to ensure global uniqueness and easy composite lookup).


Leet-Speak in Codes: We use a bit of leet (1337) speak in the codes to ensure they stand out (and avoid conflicting with real words). The mapping is:


A → 4


E → 3


I → 1


O → 0


S → 5


T → 7


L → 7 (using 7 for “L” as well, since it looks like an upside-down L and to avoid confusion with I/1).


Each TypeCode and SubCode will include at least one number from these substitutions, often replacing one letter of a key word.


Entity Type Codes: (documented in ID.md with explanations)


User: u53r – e.g. user with id 45 becomes u53r45.
 Reasoning: “user” with u and replacing s → 5, e → 3, keeps r.


Flavor: f7avour – e.g. flavor id 12 for user 45: f7avour12-45 (we can include a separator or just concatenate – in our documentation we’ll show it with a hyphen for readability, but the actual ID string may omit the hyphen).
 Reasoning: based on “flavour”, replacing l with 7.


Sub-flavor: 5ubflav or 5ubf7av – (we need a distinct code for sub-flavors). For instance, sub-flavor id 3 for user 45: 5ubflav3-45.
 Reasoning: “subflav” with s→5, (and possibly l→7 if we include the l, but to keep it shorter we might just do 5ubflav).


Alternatively, we might treat Sub-flavor as a flavor that has a parent. In that case, it could share the f7avour code but then we’d need a way to denote hierarchy. To keep it simple: we’ll use a distinct code for sub-flavors.


Ingredient: 1ngred – e.g. ingredient id 8 for user 45: 1ngred8-45.
 Reasoning: “ingred” with leading I→1.


Plan Entry (scheduled activity): p14n – e.g. plan entry (activity) id 7 for user 45: p14n7-45.
 Reasoning: “plan” with l→1 and a→4.


Review: r3view – e.g. review record id 5 for user 45: r3view5-45.
 Reasoning: “review” with e→3.


Agent (Chat/Coach): c0ach – e.g. the AI coach agent instance for user 45 could be tagged c0ach-45.
 Reasoning: “coach” with o→0.


(If additional entity types emerge, define a new code following the same pattern and document it.)


Sub-component Codes: Many entities have sub-parts (fields, buttons, etc.) that we may need to reference. We append a specific code for these:


na4me – Name/title field. E.g., f7avourna4me12-45 refers to the Name field of Flavor #12.


de5cr – Description field. E.g., f7avourde5cr12-45 is the Description of Flavor #12 (descr with s→5, leaving off the trailing letters for brevity).


li5t – A list container. E.g., f7avourli5t-45 might be the container listing all flavors of user 45.


item – A generic item element (could be a single card in a list). For instance, each flavor card could have an ID like f7avouritem12-45 as well, but usually we use the base f7avour12-45 for the container/card itself. We will clarify usage in ID.md.


ed1t – Edit button (if present).


5ave – Save button for forms (e.g., f7avour5ave12-45 for save button on flavor #12’s form).


d3l – Delete action (e.g., f7avourd3l12-45 for delete flavor #12).


(These are examples; we will add codes for any interactive element that might be targeted by tests or agents.)


ID.md Documentation: The file ID.md is the source of truth for these codes. For each entry, it explains how to compose the ID and gives examples. The agent should update ID.md whenever a new type of ID or a new sub-component code is introduced. This keeps our convention consistent and avoids collisions.


For example, when implementing the Planning page, if we decide to label each time block with an ID, we might create a code like tim3slot or block. We’d add an entry in ID.md for Plan blocks (e.g., p14nblock{Hour}{UserID} if we did hourly slots).


ID.md also notes any variations or edge cases (e.g., if user ID is not needed for some global element IDs, etc.).


Global Uniqueness & Parsing: By including type and user, these IDs are globally unique. The format also makes it straightforward to parse: an agent or function can identify the type by the prefix. For instance, any ID starting with f7avour is a Flavor-related ID. The numbers at the end can be separated (especially if we include a delimiter between EntityID and UserID, like a dash or underscore in the string).


Note: In actual code, we might use a delimiter for clarity (like f7avour12_45). Whether to include a delimiter or fixed padding for IDs will be defined in ID.md. The agent can choose a reasonable approach (e.g., use a hyphen or underscore to separate the user part) and stick with it consistently.


Usage in AI Context: These IDs will be used when assembling prompt contexts for the AI agents. For example, if the coaching agent needs to see the user’s flavor descriptions, the system might fetch all text associated with f7avourde5cr*-45 (all flavor descriptions for user 45). Consistent prefixes make it possible to pull relevant data in this way.


In summary, the ID convention is a foundational tool to keep the app’s many pieces linked and referable. It enables complex agent behaviors (like referencing specific user data) and helps with testing (unique selectors for E2E tests). make every code for every user will be unique , and all codes with its content are stored in the data base. 

AI Coding Agent Guidelines
Always Align with Project Vision: Before executing any task, the agent should recall the project’s philosophy and goals (as described above). All code should further the end product we envision. For example, if implementing a UI component, consider the design philosophy (clean, modern, dopamine-inducing) in the implementation. If writing backend logic, ensure it supports the openness and social features (e.g. designing an API that can filter content by privacy settings).


Focus on Current Task, Mindful of Context: The agent should concentrate on the issue at hand (e.g., “Add the Flavor creation form”), but do so in a way that fits the existing codebase and upcoming features. Avoid quick hacks that solve the immediate problem but conflict with anticipated features. If something doesn’t make sense or conflicts with existing structure, pause and reason it out (or consult this document/UPDATE.md).


Use Own Knowledge & Best Practices: Leverage general software engineering best practices and the agent’s training. For instance, follow the DRY principle (don’t repeat yourself) – if similar code exists, refactor or reuse. Apply the principle of least surprise – write code that other developers would find predictable and clear. The agent is essentially a senior developer on the team – it should apply patterns it knows (e.g., proper React hooks usage, accessibility practices, efficient algorithms) even if not explicitly told. It should also use the knowledge from this Agents.md and prior experience to make informed decisions while coding.


Think Critically Before Coding: Plan the solution. The agent should mentally step through how the code will run, to catch potential errors or design issues. If the agent notices a potential bug or an edge case not covered, it should address it (or at least note it and handle it gracefully). We encourage the agent’s constructive proactivity – for example, if a prompt asks to implement X but the agent knows Y is needed to make X work correctly, it should include Y (with explanation). All code should be approached with a defensive mindset (e.g., null checks, error catches where appropriate) to avoid runtime exceptions.


Iterative Development & Testing: It’s fine (even preferred) for the agent to implement in small increments and test along the way. Rather than trying to generate a massive chunk of code in one go, the agent can:


Scaffold – create basic files, types, empty functions/classes as placeholders.


Implement core logic – fill in the main functionality.


Test (virtually or actually) – consider running the code or at least doing a mental dry-run. The agent should run pnpm dev or pnpm build in its environment to catch syntax or type errors. It should run pnpm test if tests are present.


Refine – fix any issues, then add enhancements (like input validation, edge cases, comments).


Polish – ensure formatting (pnpm format or Prettier) and linting (pnpm lint) pass. Resolve any TypeScript warnings. The goal is zero errors and a clean pnpm build.


Adhere to Conventions: Follow the styles and patterns already in the codebase:


Use the same naming conventions (check existing file and variable names).


If using a library like shadcn/ui, follow how other components use it (consistent prop usage, styling).


Keep functions and components focused; if they get too large, consider splitting them.


Write comments to explain non-obvious logic, especially any workaround or complex calculation (but avoid redundant comments for self-explanatory code).


Use Git commit conventions if any (e.g., conventional commits like feat:, fix: prefixes, if we decide on one).


Adopt Security Mindset: As noted, always think about how the code could be misused or fail. For example, when writing an SQL query via Drizzle, think: could a parameter be undefined? Could this expose data from another user? When coding file uploads or similar, consider file type restrictions and size limits. The agent should include security checks proactively.


Freedom to Improve: The agent has explicit permission to make minor adjustments for the betterment of the project, even if not asked. For example:


If the user story says “display a list of flavors”, and the agent knows the list could be long, the agent can implement pagination or lazy loading (and mention it in the PR).


If writing a function and noticing an existing similar function could be refactored to be reused, the agent can refactor it.


If an API response should include some data for future use, the agent can include it (with justification).


However, the agent should not go on tangents or build unrequested features. Keep improvements relevant and small in scope. Major redesigns or feature additions should be saved for explicit tasks.


Testing Your Work: Before finalizing any change, the agent should verify that the app runs without errors:


Run type checks (pnpm type-check or tsc) to ensure no TypeScript errors.


Run linting (pnpm lint) for coding style issues.


Launch the dev server and quickly manually test the new feature if possible (or think through the UI logic to ensure it works as intended).


Run Playwright tests (pnpm test) to catch regressions. If tests need updates due to the code changes, update them.


The agent should only consider a task “done” when all these verifications pass (in an automated environment, these would be CI checks before merge).


Pull Request & Update Log: For each unit of work, the agent should:


Write a clear Pull Request description or commit message that outlines what was done and why. Include references to issues or tasks IDs if available. For example: “Added Flavor creation modal. Allows user to add new flavor with name, description, importance. Includes form validation and updates state. Closes #12.”


Keep commits atomic and focused (it’s okay to have multiple commits for one PR if logically separated, like “Setup Flavor model” and “Implement Flavor form UI”).


Update UPDATE.md: This file serves as a changelog. Append an entry describing the update. For example:


2025-08-16: Added Flavor entity, creation form, and listing page. Implemented UI and backend, agent-assisted. Updated Agents.md with Flavor ID scheme.


Be concise but informative. This helps anyone (including the AI agent in future sessions) quickly grasp what has been done so far.
Before marking a PR ready, ensure “all checks are green” – all tests pass and no ESLint/Type errors remain.


Communication: If the agent is unsure about something, it should either make an assumption (documenting it in comments or PR message) or ask for clarification (depending on the interface available – e.g., as an AI paired with a developer, it might ask in the conversation). It’s better to clarify than to implement incorrectly. When making assumptions, document them clearly (in code comments or commit message) so maintainers can adjust if needed.


Respect Explicit Instructions: Agents.md provides general guidance, but if a specific task instruction conflicts with these guidelines, the specific instruction wins. For example, if a user story explicitly says “do not include an email field in the profile page” even though it might make sense to have one, the agent should follow the instruction. Use common sense and, when in doubt, err on the side of what the human stakeholder requested.


Continuous Learning: After each major step or PR, the agent should take into account any feedback (if provided by humans) and update the approach. If maintainers modify the agent’s code, review those changes to avoid repeating mistakes.
INCLUDE in the README instructions on how to install the dependencies, how to launch the project locally etc. make it detailed

### Viewing Mode

- Interfaces rendered with `ViewContext` where `editable` is false must be strictly read-only. Disable save, update, delete, and similar controls, and ensure navigation stays on `/view/[viewId]` paths for viewers.


By following the above, the AI agent will function as a reliable, efficient collaborator in building A Piece of Cake. These rules help ensure that even as multiple tasks and iterations proceed, the project remains coherent, secure, and aligned with its vision.




