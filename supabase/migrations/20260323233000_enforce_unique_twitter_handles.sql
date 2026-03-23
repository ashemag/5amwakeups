update public.fiveam_members
set twitter_handle = lower(regexp_replace(twitter_handle, '^@', ''))
where twitter_handle <> lower(regexp_replace(twitter_handle, '^@', ''));

with ranked_members as (
  select
    id,
    row_number() over (
      partition by lower(twitter_handle)
      order by
        (wake_time is not null and best_time is not null) desc,
        jsonb_array_length(coalesce(daily_records, '[]'::jsonb)) desc,
        updated_at desc,
        created_at desc,
        id desc
    ) as row_number
  from public.fiveam_members
)
delete from public.fiveam_members members
using ranked_members
where members.id = ranked_members.id
  and ranked_members.row_number > 1;

create unique index if not exists fiveam_members_twitter_handle_unique_idx
  on public.fiveam_members (lower(twitter_handle));
