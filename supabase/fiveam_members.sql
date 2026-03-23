create extension if not exists pgcrypto;

create table if not exists public.fiveam_members (
  id uuid primary key default gen_random_uuid(),
  oura_user_id text not null unique,
  display_name text not null,
  twitter_handle text not null,
  city text,
  email text,
  avatar_url text not null,
  wake_time text,
  wake_timestamp timestamptz,
  best_time text,
  streak integer not null default 0,
  daily_records jsonb not null default '[]'::jsonb,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz,
  scopes text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists fiveam_members_updated_at_idx
  on public.fiveam_members (updated_at desc);

create unique index if not exists fiveam_members_twitter_handle_unique_idx
  on public.fiveam_members (lower(twitter_handle));

alter table public.fiveam_members
  alter column wake_time drop not null,
  alter column wake_timestamp drop not null,
  alter column best_time drop not null;
