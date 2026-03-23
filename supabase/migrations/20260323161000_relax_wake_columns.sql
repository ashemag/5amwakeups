alter table public.fiveam_members
  alter column wake_time drop not null,
  alter column wake_timestamp drop not null,
  alter column best_time drop not null;
