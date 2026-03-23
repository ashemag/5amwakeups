# Fiveam Club

An elegant, minimalist social leaderboard for verified early wakeups.

## Concept

Fiveam Club turns waking up early into a status game:

- members connect Oura so wake times can be verified
- members enter their X username so the product can show their avatar
- each morning the leaderboard highlights who woke up in the `5:00` to `5:59` window
- wakeups at `5:00 AM` or earlier score greener and rank higher

## What is in this repo

- a polished landing page and app shell
- onboarding UI for Oura + X username
- a real Oura OAuth callback
- Supabase-backed member persistence
- a live leaderboard with streaks, avatars, and scoring

## Current integration status

The app now exchanges a real Oura authorization code, fetches the member's latest daily sleep summary, extracts the verified wake time from `bedtime_end`, and writes that member into Supabase. Avatars are still derived from the submitted X username through `unavatar.io`.

## Environment

The local repo includes a configured `.env.local` for development, and `.env.example` shows the expected keys.

Important values:

- `OURA_CLIENT_ID`
- `OURA_CLIENT_SECRET`
- `OURA_REDIRECT_URI`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

## Supabase setup

Run the SQL in `supabase/fiveam_members.sql` inside the Supabase SQL editor before testing the Oura callback.

That creates the `fiveam_members` table used by:

- `GET /api/leaderboard`
- `GET /api/auth/oura/callback`

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Oura callback URL

Use this redirect URI in the Oura developer app:

```text
http://localhost:3000/api/auth/oura/callback
```

## Good next steps

1. Refresh Oura access tokens automatically with the stored refresh token.
2. Replace the public avatar lookup with a first-party X profile sync if needed.
3. Add private groups so friends can compete in smaller circles.
4. Add daily notifications and streak-protection mechanics.
