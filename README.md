# ConnectAssist

Event planning assistant for the Connector at **The Social Hub The Hague**. It replaces six scattered tools and a stack of printed rundowns with one visual web app: plan an event, get its rundown generated automatically, build the floor plan, share it with staff as a link or PDF, and look back at past events and vendors in seconds.

Built as part of a Fontys ICT internship project. Primary user: Pawl Berger (Connector).

## Status: V1 (in testing with Pawl)

| Feature | State |
|---|---|
| Dashboard (next up, to-dos, calendar, search) | Done |
| Event maker (auto-generates the rundown) | Done |
| Gallery (filters, search, cover photos) | Done |
| Event page + post-event update (actual guests, rating, reflection) | Done |
| Rundown editor + standard elements | Done |
| **Floor plan builder** (5 rooms, drag and drop, presets, PDF) | Done |
| PDF export + public share link (no staff accounts) | Done |
| Vendor / contact directory | Done |
| Guest stats | Planned |
| Guest-return tracking | Out of scope until GDPR review |

## Floor plan builder

Rooms: **Restaurant & Bar, Meeting Space 1, Meeting Space 2+3, Catwalk, Lobby.**

- Drag elements from the palette (or click to add): round table, long table, sofa, stage, bar, plant, DJ booth, door, seating block, plus custom elements.
- Starter presets per room (Cabaret, Theatre, Lounge party, Blank) are generated to fit the room and flow around pillars. Layouts can be saved as your own presets.
- Move by dragging or arrow keys, rotate, resize, duplicate, undo/redo, zoom. Seat and table counts update live.
- Autosaves to the event, ticks the "Floor plan" to-do, shows on the event page, the rundown, the public share page, and exports as PDF.
- Reusing a past event copies its floor plan.

> **Room dimensions are estimates.** Real measurements go in `src/lib/rooms.ts` (width/height in cm plus pillars, storage, entrances). Every plan redraws automatically.
## Tech stack

- React 18 + TypeScript + Vite
- Supabase (Postgres, Auth, Row Level Security) for persistent storage
- Netlify for hosting, deployed from this repo
- jsPDF for client-side PDF export

## Run locally

```bash
npm install
npm run dev
```

With no `.env` file the app runs in **demo mode**: data is stored in your browser only. Use "Load sample events" on the dashboard to try it.

To connect a real database, copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Set up the database

1. Create a Supabase project (EU region).
2. Open **SQL Editor**, paste all of `supabase/schema.sql`, and run it. **The file is safe to re-run**, so after pulling an update just run it again.
3. Under **Authentication**, disable public sign-ups and create one user each for the Connector and the Connector Intern.

## Deploy

1. Import this repo in Netlify. Build settings come from `netlify.toml`.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
3. Every push to `main` deploys automatically.

The anon key is safe in the browser: Row Level Security allows only signed-in users to read or write, and public share links can only fetch a single rundown by its secret token.

## Configuration

- `src/config.ts`: room list for the event form, week start day, rundown "who" suggestions
- `src/lib/rooms.ts`: room dimensions and fixed features for the floor plan builder
- `src/lib/schedule.ts`: default rundown timings per event type

## Project structure

```
src/
  pages/        one file per screen
  components/   shared UI (modal, notes box, floor plan renderer)
  state/        auth, store, toasts
  data/         database layer (Supabase + browser fallback)
  lib/          dates, schedule generator, floor plan logic, PDF, helpers
supabase/
  schema.sql    tables, security policies, share-link function (re-runnable)
```

## Privacy and ethics

Follows the project's Professional Standard:

- **Data minimisation:** contacts store name, category, speciality, email, phone and notes only.
- **Right to removal:** deleting a contact removes it and unlinks it from every event (database trigger).
- **No staff accounts:** staff view rundowns through a revocable link or PDF. Shared pages show vendor names only, never contact details.
- **No personal guest data:** guest counts are plain numbers.
- **Inclusive by default:** high contrast, large click targets, status always shown as text, single free-text name field.

## Version control

Small commits with a description of *what changed and why*, for example:

```
git add .
git commit -m "Hide floor plan card when an event doesn't need one (Pawl feedback)"
git push
```

## Roadmap

1. Real room measurements for the floor plan builder
2. Guest stats screen
3. Brand colours from the TSH Brand Guide
4. Test on-the-day access (paper vs phone) with staff
5. Forward-looking for TSH IT: automatic sync with Monday / Eventbrite / Event Temple, guest-return tracking after GDPR review
