# The 5AM Club

A social leaderboard for verified 5AM wakeups. Connect your Oura ring, prove you woke up, and compete with friends.

## How it works

1. Sign in with X
2. Connect your Oura ring
3. Your verified wake time appears on the public leaderboard

Wakeups closer to 5:00 AM rank higher. Streaks are tracked daily.

## Stack

- **Next.js** (App Router)
- **Supabase** (auth, database)
- **Oura API** (sleep data / wake time verification)
- **Tailwind CSS v4**

## Run locally

```bash
npm install
cp .env.example .env.local  # fill in your keys
npm run dev
```

## Environment variables

See `.env.example` for the full list. You'll need:

- Supabase project credentials
- Oura OAuth client ID and secret
- Slack bot token and channel ID (optional, for alerts)

## License

MIT
