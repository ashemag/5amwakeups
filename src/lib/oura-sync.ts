import { fetchRecentWakeSnapshots } from "@/lib/oura";
import { upsertStoredMember, type UpsertMemberInput } from "@/lib/member-store";

type SyncOuraSleepHistoryInput = Omit<UpsertMemberInput, "dailyRecords">;

export async function syncOuraSleepHistory(
  input: SyncOuraSleepHistoryInput,
  daysBack = 30,
) {
  const wakeSnapshots = await fetchRecentWakeSnapshots(input.accessToken, daysBack);

  await upsertStoredMember({
    ...input,
    dailyRecords: wakeSnapshots.map((snapshot) => ({
      date: snapshot.wakeDate,
      wakeTime: snapshot.wakeTime,
      wakeTimestamp: snapshot.wakeTimestamp,
    })),
  });

  return {
    importedDays: wakeSnapshots.length,
    hasSleepData: wakeSnapshots.length > 0,
  };
}
