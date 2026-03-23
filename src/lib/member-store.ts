import { createSupabaseAdminClient } from "@/lib/supabase";
import { getWakeStatus, type Member } from "@/lib/wake-data";

type DailyRecord = {
  date: string;
  wakeTime: string;
  wakeTimestamp: string;
};

type MemberRow = {
  access_token: string;
  avatar_url: string;
  best_time: string;
  city: string | null;
  created_at: string;
  daily_records: DailyRecord[] | null;
  display_name: string;
  email: string | null;
  id: string;
  oura_user_id: string;
  refresh_token: string;
  scopes: string[] | null;
  streak: number;
  token_expires_at: string | null;
  twitter_handle: string;
  updated_at: string;
  wake_time: string;
  wake_timestamp: string;
};

type UpsertMemberInput = {
  accessToken: string;
  displayName: string;
  email?: string | null;
  ouraUserId: string;
  refreshToken: string;
  scopes: string[];
  tokenExpiresAt: string;
  twitterHandle: string;
  wakeDate: string;
  wakeTime: string;
  wakeTimestamp: string;
};

function toDayStart(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function sortRecords(records: DailyRecord[]) {
  return [...records].sort((left, right) => right.date.localeCompare(left.date));
}

function mergeDailyRecords(records: DailyRecord[], nextRecord: DailyRecord) {
  const deduped = records.filter((record) => record.date !== nextRecord.date);
  return sortRecords([nextRecord, ...deduped]).slice(0, 7);
}

function calculateStreak(records: DailyRecord[]) {
  const sorted = sortRecords(records);

  if (sorted.length === 0) {
    return 0;
  }

  let streak = 0;
  const cursor = toDayStart(sorted[0].date);

  for (const record of sorted) {
    if (record.date !== cursor.toISOString().slice(0, 10)) {
      break;
    }

    if (!getWakeStatus(record.wakeTime).qualifies) {
      break;
    }

    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

function calculateBestTime(records: DailyRecord[]) {
  if (records.length === 0) {
    return "05:00";
  }

  return [...records]
    .sort((left, right) => left.wakeTime.localeCompare(right.wakeTime))[0]
    .wakeTime;
}

function mapRowToMember(row: MemberRow): Member {
  const weeklyTimes =
    row.daily_records
      ?.map((record) => record.wakeTime)
      .filter(Boolean)
      .slice(0, 7) ?? [];

  return {
    id: row.id,
    name: row.display_name,
    handle: row.twitter_handle,
    city: row.city ?? "Verified member",
    streak: row.streak,
    wakeTime: row.wake_time,
    bestTime: row.best_time,
    avatarUrl: row.avatar_url,
    ouraConnected: true,
    weeklyTimes: weeklyTimes.length ? weeklyTimes : [row.wake_time],
  };
}

export async function listStoredMembers() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("fiveam_members")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205" || error.message.includes("does not exist")) {
      return [];
    }

    throw error;
  }

  return ((data ?? []) as MemberRow[]).map(mapRowToMember);
}

export async function upsertStoredMember(input: UpsertMemberInput) {
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("fiveam_members")
    .select("*")
    .eq("oura_user_id", input.ouraUserId)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    throw existingError;
  }

  const existingRow = (existing as MemberRow | null) ?? null;
  const mergedRecords = mergeDailyRecords(existingRow?.daily_records ?? [], {
    date: input.wakeDate,
    wakeTime: input.wakeTime,
    wakeTimestamp: input.wakeTimestamp,
  });

  const payload = {
    access_token: input.accessToken,
    avatar_url: `https://unavatar.io/x/${input.twitterHandle}`,
    best_time: calculateBestTime(mergedRecords),
    city: existingRow?.city ?? null,
    daily_records: mergedRecords,
    display_name: input.displayName,
    email: input.email ?? null,
    oura_user_id: input.ouraUserId,
    refresh_token: input.refreshToken,
    scopes: input.scopes,
    streak: calculateStreak(mergedRecords),
    token_expires_at: input.tokenExpiresAt,
    twitter_handle: input.twitterHandle,
    updated_at: new Date().toISOString(),
    wake_time: input.wakeTime,
    wake_timestamp: input.wakeTimestamp,
  };

  const { error } = await supabase
    .from("fiveam_members")
    .upsert(payload, { onConflict: "oura_user_id" });

  if (error) {
    throw error;
  }
}
