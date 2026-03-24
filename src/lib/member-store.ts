import { createSupabaseAdminClient } from "@/lib/supabase";
import { getWakeStatus, type Member } from "@/lib/wake-data";
import { getHighQualityXAvatarUrl } from "@/lib/x-avatar";

export type DailyRecord = {
  date: string;
  wakeTime: string;
  wakeTimestamp: string;
};

type MemberRow = {
  access_token: string;
  avatar_url: string;
  best_time: string | null;
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
  wake_time: string | null;
  wake_timestamp: string | null;
};

export type UpsertMemberInput = {
  accessToken: string;
  avatarUrl?: string | null;
  dailyRecords: DailyRecord[];
  displayName: string;
  email?: string | null;
  ouraUserId: string;
  refreshToken: string;
  scopes: string[];
  tokenExpiresAt: string;
  twitterHandle: string;
};

function normalizeHandle(handle: string) {
  return handle.trim().replace(/^@/, "").toLowerCase();
}

function toDayStart(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

function sortRecords(records: DailyRecord[]) {
  return [...records].sort((left, right) => right.date.localeCompare(left.date));
}

function getDailyRecordCount(records: DailyRecord[] | null | undefined) {
  return records?.length ?? 0;
}

function compareMemberRows(left: MemberRow, right: MemberRow) {
  const leftHasWakeData = Number(Boolean(left.wake_time && left.best_time));
  const rightHasWakeData = Number(Boolean(right.wake_time && right.best_time));

  if (leftHasWakeData !== rightHasWakeData) {
    return rightHasWakeData - leftHasWakeData;
  }

  const dailyRecordDelta =
    getDailyRecordCount(right.daily_records) - getDailyRecordCount(left.daily_records);

  if (dailyRecordDelta !== 0) {
    return dailyRecordDelta;
  }

  const updatedAtDelta =
    new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();

  if (updatedAtDelta !== 0) {
    return updatedAtDelta;
  }

  return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
}

function pickCanonicalRow(rows: MemberRow[]) {
  return [...rows].sort(compareMemberRows)[0] ?? null;
}

function mergeDailyRecords(records: DailyRecord[], nextRecords: DailyRecord[]) {
  const byDate = new Map<string, DailyRecord>();

  for (const record of [...records, ...nextRecords]) {
    byDate.set(record.date, record);
  }

  return sortRecords([...byDate.values()]).slice(0, 30);
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
    return null;
  }

  return [...records]
    .sort((left, right) => left.wakeTime.localeCompare(right.wakeTime))[0]
    .wakeTime;
}

function getLatestRecord(records: DailyRecord[]) {
  return sortRecords(records)[0] ?? null;
}

function mapRowToMember(row: MemberRow): Member {
  if (!row.wake_time || !row.best_time) {
    throw new Error("Tried to map a member without wake data.");
  }

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
    avatarUrl: getHighQualityXAvatarUrl({
      avatarUrl: row.avatar_url,
      username: row.twitter_handle,
    }),
    ouraConnected: true,
    weeklyTimes: weeklyTimes.length ? weeklyTimes : [row.wake_time],
  };
}

export async function getConnectedMemberCount() {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("fiveam_members")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function isHandleAlreadyConnected(handle: string) {
  const normalizedHandle = normalizeHandle(handle);

  if (!normalizedHandle) {
    return false;
  }

  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("fiveam_members")
    .select("id", { count: "exact", head: true })
    .eq("twitter_handle", normalizedHandle);

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}

export async function listStoredMembers() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("fiveam_members")
    .select("*")
    .not("wake_time", "is", null)
    .order("updated_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205" || error.message.includes("does not exist")) {
      return [];
    }

    throw error;
  }

  const rows = (data ?? []) as MemberRow[];
  const dedupedRows = new Map<string, MemberRow>();

  for (const row of [...rows].sort(compareMemberRows)) {
    const handle = normalizeHandle(row.twitter_handle);
    if (!handle || dedupedRows.has(handle)) {
      continue;
    }
    dedupedRows.set(handle, row);
  }

  return [...dedupedRows.values()].map(mapRowToMember);
}

export async function getStoredMemberStatus(handle: string) {
  const normalizedHandle = normalizeHandle(handle);

  if (!normalizedHandle) {
    return {
      connected: false,
      hasSleepData: false,
      member: null,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("fiveam_members")
    .select("*")
    .eq("twitter_handle", normalizedHandle)
    .order("updated_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205" || error.message.includes("does not exist")) {
      return {
        connected: false,
        hasSleepData: false,
        member: null,
      };
    }

    throw error;
  }

  const row = pickCanonicalRow((data ?? []) as MemberRow[]);

  if (!row) {
    return {
      connected: false,
      hasSleepData: false,
      member: null,
    };
  }

  const hasSleepData = Boolean(row.wake_time && row.best_time);

  return {
    connected: true,
    hasSleepData,
    member: hasSleepData ? mapRowToMember(row) : null,
  };
}

export async function upsertStoredMember(input: UpsertMemberInput) {
  const supabase = createSupabaseAdminClient();
  const normalizedHandle = normalizeHandle(input.twitterHandle);
  const { data: existing, error: existingError } = await supabase
    .from("fiveam_members")
    .select("*")
    .or(`oura_user_id.eq.${input.ouraUserId},twitter_handle.eq.${normalizedHandle}`)
    .order("updated_at", { ascending: false });

  if (existingError) {
    throw existingError;
  }

  const existingRows = (existing ?? []) as MemberRow[];
  const existingRow = pickCanonicalRow(existingRows);
  const mergedRecords = mergeDailyRecords(
    existingRows.flatMap((row) => row.daily_records ?? []),
    input.dailyRecords,
  );
  const latestRecord = getLatestRecord(mergedRecords);
  const bestTime = calculateBestTime(mergedRecords) ?? existingRow?.best_time ?? null;

  const payload = {
    access_token: input.accessToken,
    avatar_url: getHighQualityXAvatarUrl({
      avatarUrl: input.avatarUrl,
      username: input.twitterHandle,
    }),
    city: existingRow?.city ?? null,
    daily_records: mergedRecords,
    display_name: input.displayName,
    email: input.email ?? null,
    oura_user_id: input.ouraUserId,
    refresh_token: input.refreshToken,
    scopes: input.scopes,
    streak: calculateStreak(mergedRecords),
    token_expires_at: input.tokenExpiresAt,
    twitter_handle: normalizedHandle,
    updated_at: new Date().toISOString(),
    wake_time: latestRecord?.wakeTime ?? existingRow?.wake_time ?? null,
    wake_timestamp:
      latestRecord?.wakeTimestamp ?? existingRow?.wake_timestamp ?? null,
    best_time: bestTime,
  };

  let error = null;

  if (existingRow) {
    const updateResult = await supabase
      .from("fiveam_members")
      .update(payload)
      .eq("id", existingRow.id);
    error = updateResult.error;
  } else {
    const insertResult = await supabase.from("fiveam_members").insert(payload);
    error = insertResult.error;
  }

  if (error) {
    throw error;
  }

  const duplicateIds = existingRows
    .map((row) => row.id)
    .filter((id) => id !== existingRow?.id);

  if (duplicateIds.length > 0) {
    const { error: duplicateDeleteError } = await supabase
      .from("fiveam_members")
      .delete()
      .in("id", duplicateIds);

    if (duplicateDeleteError) {
      throw duplicateDeleteError;
    }
  }
}
