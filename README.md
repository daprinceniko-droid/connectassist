# ConnectAssist V1

Event planning for the Connector at The Social Hub The Hague. React + TypeScript + Vite, Supabase for storage, hosted on Netlify.

**In this build:** dashboard, gallery, event maker (auto-builds the rundown), event pages, post-event update, rundown editor, PDF export, share links, vendor/contact directory, search.
**Not yet:** floor plan builder (placeholder page), guest stats, guest-return tracking.

## Run it locally (demo mode)
```
npm install
npm run dev
```
With no `.env`, the app runs in **demo mode**: data lives in this browser only. Click "Load sample events" on the dashboard to try it.

## Go live in ~15 minutes

### 1. Supabase (the database)
1. Create a free project at supabase.com. Pick the **EU (Frankfurt)** region (GDPR).
2. **SQL Editor** → paste all of `supabase/schema.sql` → Run.
3. **Authentication → Providers → Email**: turn **off** "Allow new users to sign up".
4. **Authentication → Users → Add user**: create one for Pawl and one for the Connector Intern (tick "Auto confirm").
5. **Project Settings → API**: copy the **Project URL** and the **anon public** key.

### 2. GitHub
Create a repo and push this folder (`node_modules`, `dist` and `.env` are git-ignored).

### 3. Netlify
1. Add new site → Import from GitHub → pick the repo. Build settings are read from `netlify.toml`.
2. **Site configuration → Environment variables**, add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
3. Deploy. Open the site and sign in.

The anon key is safe to ship in the browser: Row Level Security means only signed-in users can read or write, and the public share links can only fetch one rundown by its secret token.

## Things Pawl may want to change (`src/config.ts`)
- `ROOMS`: the room list in the event form
- `WEEK_STARTS_ON`: 0 = Sunday first (as in the design), 1 = Monday first
- `OWNERS`: suggestions for the "Who" field in the rundown

The default rundown timings live in `src/lib/schedule.ts` (one template per event type).

## Privacy notes (Professional Standard, section 4)
- Contacts store name, category, speciality, email, phone, notes. Nothing else.
- Removing a contact deletes it and unlinks it from every event (database trigger).
- Share links show contact **names** only, never emails or phone numbers, and can be revoked ("Stop sharing").
- Guest counts are numbers only. No personal guest data is stored.
