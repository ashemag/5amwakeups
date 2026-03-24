import { NextRequest, NextResponse } from "next/server";
import { refreshOuraTokens } from "@/lib/oura";
import {
  getAllMembersForSync,
  updateMemberTokens,
  type SyncableMember,
} from "@/lib/member-store";
import { syncOuraSleepHistory } from "@/lib/oura-sync";
import { notifySlack } from "@/lib/slack/notify";
import { notifyError } from "@/lib/slack/notify";

export const maxDuration = 60;

async function resolveAccessToken(
  member: SyncableMember,
): Promise<string> {
  const expiresAt = member.tokenExpiresAt
    ? new Date(member.tokenExpiresAt).getTime()
    : 0;

  // Refresh if token expires within 5 minutes
  if (expiresAt > Date.now() + 5 * 60 * 1000) {
    return member.accessToken;
  }

  const tokens = await refreshOuraTokens(member.refreshToken);
  const newExpiresAt = new Date(
    Date.now() + tokens.expires_in * 1000,
  ).toISOString();

  await updateMemberTokens(
    member.id,
    tokens.access_token,
    tokens.refresh_token,
    newExpiresAt,
  );

  return tokens.access_token;
}

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const members = await getAllMembersForSync();
    let synced = 0;
    let failed = 0;

    for (const member of members) {
      try {
        const accessToken = await resolveAccessToken(member);

        await syncOuraSleepHistory({
          accessToken,
          avatarUrl: member.avatarUrl,
          displayName: member.displayName,
          email: member.email,
          ouraUserId: member.ouraUserId,
          refreshToken: member.refreshToken,
          scopes: member.scopes,
          tokenExpiresAt: member.tokenExpiresAt ?? "",
          twitterHandle: member.twitterHandle,
        });

        synced++;
      } catch (error) {
        failed++;
        console.error(`Sync failed for @${member.twitterHandle}`, error);
        void notifyError(
          "/api/cron/sync-sleep",
          `Daily sync failed for @${member.twitterHandle}`,
          error instanceof Error ? error.message : undefined,
        );
      }
    }

    void notifySlack(
      `\u{2600}\u{fe0f} *Daily sync complete*\nSynced: ${synced} | Failed: ${failed} | Total: ${members.length}`,
    );

    return NextResponse.json({ synced, failed, total: members.length });
  } catch (error) {
    console.error("Cron sync-sleep failed", error);
    void notifyError(
      "/api/cron/sync-sleep",
      "Daily sync cron failed entirely",
      error instanceof Error ? error.message : undefined,
    );
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 },
    );
  }
}
