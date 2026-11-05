# ConnectAssist

ConnectAssist is an event-planning workspace for the Connector team at The Social Hub The Hague. It brings event details, schedules, room layouts, and contact information together so the team can plan events and share a clear rundown with staff.

## What it does

- Create and manage events, including recurring events.
- Generate and edit event rundowns, with a dashboard for upcoming work and to-dos.
- Browse past events and search event and contact information.
- Track post-event attendance, ratings, and reflections.
- Build room layouts with draggable furniture, presets, undo/redo, and live table and seat counts.
- Export a rundown or floor plan as a PDF, or share a read-only rundown link with staff.
- Maintain a vendor and contact directory.

The floor-plan builder includes Restaurant & Bar, Meeting Space 1, Meeting Space 2+3, Catwalk, and Lobby. Room dimensions are estimates; update them in `src/lib/rooms.ts` when verified measurements are available.

## Tech stack

- React 18, TypeScript, and Vite
- Supabase for hosted data and authentication
- Browser storage for local demo data
- jsPDF for client-side PDF export
- Netlify for deployment

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. With the Supabase variables unset, ConnectAssist runs in demo mode and stores data in the current browser. Use **Load sample events** on the dashboard to explore the app. Demo data is not synced or backed up.

To use a Supabase project, copy `.env.example` to `.env` and set:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Restart the dev server after changing environment variables. Do not put a Supabase service-role key in the browser app.

## Supabase setup

1. Create a Supabase project.
2. Open the project's **SQL Editor**, run the contents of [`supabase/schema.sql`](./supabase/schema.sql), and confirm the tables and policies were created.
3. In Supabase Authentication, disable public sign-ups and create accounts for the authorized team members.
4. Add the project URL and anon key to `.env` locally and to the deployment environment.

The schema can be re-run to apply its table, column, index, policy, and function definitions. Row-level security restricts the app's data tables to authenticated users. Public share links expose only the selected event rundown and limited contact names/categories; they do not expose contact details or post-event reflections.

## Build and preview

```bash
npm run build
npm run preview
```

`npm run build` runs the TypeScript project build and creates the production site in `dist/`.

## Deploy

The repository is configured for Netlify in [`netlify.toml`](./netlify.toml). Import the repository in Netlify and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the site's environment variables. Netlify builds with `npm run build` and publishes `dist/`; the redirect configuration supports client-side routes.

## Project layout

```text
src/
  components/  Shared interface components
  data/        Supabase and browser-storage data layers, sample data
  lib/         Scheduling, recurrence, floor plans, PDF, dates, and helpers
  pages/       Application screens
  state/       Authentication, app data, and notifications
supabase/
  schema.sql   Tables, row-level security, and public share-link function
```

Useful configuration lives in:

- `src/config.ts` — rooms, week start, and rundown owner suggestions
- `src/lib/rooms.ts` — room dimensions and fixed layout features
- `src/lib/schedule.ts` — default rundown timings

## Privacy

- Contact records contain only the details needed to coordinate events.
- Deleting a contact removes its references from events.
- Shared rundowns show vendor names and categories, not contact details.
- Guest attendance is stored as a count; the app does not track individual guests.
- Guest-return tracking is out of scope pending a privacy review.
