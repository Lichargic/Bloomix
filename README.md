# Bloomix

Bloomix is a Vite + React productivity app with Supabase-backed auth, profile, daily task, and scheduling flows.

## Run Locally

```bash
npm install
npm run dev
```

## Verify

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Structure

- `src/pages/` contains route-level screens.
- `src/components/` contains reusable UI and app widgets.
- `src/hooks/` contains data and browser-state hooks.
- `src/lib/` contains framework-light utilities, Supabase setup, and page model helpers.
- `src/styles/` contains the hand-rolled Bloomix CSS.
- `public/assets/` contains production-owned static assets.
- `scripts/` contains local maintenance tooling.
