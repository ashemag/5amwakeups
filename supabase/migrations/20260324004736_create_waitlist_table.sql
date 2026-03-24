CREATE TABLE IF NOT EXISTS fiveam_waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  twitter_handle text NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
