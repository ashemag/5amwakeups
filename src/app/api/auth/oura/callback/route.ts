import { after, NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { exchangeCodeForTokens, fetchOuraPersonalInfo } from "@/lib/oura";
import { upsertStoredMember } from "@/lib/member-store";
import { syncOuraSleepHistory } from "@/lib/oura-sync";
import { notifyError } from "@/lib/slack/notify";
import {
  notifyOuraConnected,
  notifySleepSynced,
} from "@/lib/slack/product-events";

type OnboardingCookie = {
  avatarUrl?: string;
  handle?: string;
  name?: string;
  nextPath?: string;
};

function buildHomeRedirect(
  auth: string,
  nextPath?: string,
  handle?: string,
  detail?: string,
) {
  const pathname =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/";
  const url = new URL(pathname, env.appUrl);
  url.searchParams.set("auth", auth);

  if (handle) {
    url.searchParams.set("handle", handle);
  }

  if (detail) {
    url.searchParams.set("auth_detail", detail.slice(0, 220));
  }

  return url;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const errorDescription =
    request.nextUrl.searchParams.get("error_description") ??
    request.nextUrl.searchParams.get("detail") ??
    "";
  const returnedState = request.nextUrl.searchParams.get("state");
  const grantedScopes = request.nextUrl.searchParams.get("scope") ?? "";
  const storedState = request.cookies.get("fiveam_oura_state")?.value;
  const onboardingCookie = request.cookies.get("fiveam_onboarding")?.value;

  let onboarding: OnboardingCookie = {};

  if (onboardingCookie) {
    try {
      onboarding = JSON.parse(onboardingCookie) as OnboardingCookie;
    } catch {
      onboarding = {};
    }
  }

  const cleanHandle = onboarding.handle?.replace(/^@/, "").trim();

  if (error) {
    const authState = error === "access_denied" ? "denied" : "oura_error";
    const response = NextResponse.redirect(
      buildHomeRedirect(
        authState,
        onboarding.nextPath,
        cleanHandle,
        errorDescription || error,
      ),
    );
    response.cookies.delete("fiveam_oura_state");
    response.cookies.delete("fiveam_onboarding");
    return response;
  }

  if (!code || !returnedState || returnedState !== storedState) {
    const response = NextResponse.redirect(
      buildHomeRedirect("invalid_state", onboarding.nextPath, cleanHandle),
    );
    response.cookies.delete("fiveam_oura_state");
    response.cookies.delete("fiveam_onboarding");
    return response;
  }

  if (!cleanHandle) {
    const response = NextResponse.redirect(
      buildHomeRedirect("missing_handle", onboarding.nextPath),
    );
    response.cookies.delete("fiveam_oura_state");
    response.cookies.delete("fiveam_onboarding");
    return response;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const personalInfo = await fetchOuraPersonalInfo(tokens.access_token);
    const resolvedScopes = (tokens.scope ?? grantedScopes)
      .split(" ")
      .map((scope) => scope.trim())
      .filter(Boolean);

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await upsertStoredMember({
      accessToken: tokens.access_token,
      avatarUrl: onboarding.avatarUrl?.trim() || null,
      dailyRecords: [],
      displayName: onboarding.name?.trim() || cleanHandle,
      email: personalInfo.email ?? null,
      ouraUserId: personalInfo.id,
      refreshToken: tokens.refresh_token,
      scopes: resolvedScopes,
      tokenExpiresAt,
      twitterHandle: cleanHandle,
    });
    console.log("Oura member persisted", {
      handle: cleanHandle,
      ouraUserId: personalInfo.id,
      grantedScopes: resolvedScopes,
    });

    void notifyOuraConnected(cleanHandle, onboarding.name?.trim());

    after(async () => {
      try {
        const syncResult = await syncOuraSleepHistory({
          accessToken: tokens.access_token,
          avatarUrl: onboarding.avatarUrl?.trim() || null,
          displayName: onboarding.name?.trim() || cleanHandle,
          email: personalInfo.email ?? null,
          ouraUserId: personalInfo.id,
          refreshToken: tokens.refresh_token,
          scopes: resolvedScopes,
          tokenExpiresAt,
          twitterHandle: cleanHandle,
        });
        console.log("Oura sleep history synced", {
          handle: cleanHandle,
          importedDays: syncResult.importedDays,
          hasSleepData: syncResult.hasSleepData,
        });

        void notifySleepSynced(
          cleanHandle,
          syncResult.importedDays,
          onboarding.name?.trim(),
        );
      } catch (syncError) {
        console.error("Oura sleep history sync failed", syncError);
        void notifyError(
          "/api/auth/oura/callback (sync)",
          `Sleep sync failed for @${cleanHandle}`,
          syncError instanceof Error ? syncError.message : undefined,
        );
      }
    });

    const response = NextResponse.redirect(
      buildHomeRedirect(
        "connected",
        onboarding.nextPath,
        cleanHandle,
        "Oura connected. Importing the last 30 days of sleep data now.",
      ),
    );
    response.cookies.delete("fiveam_oura_state");
    response.cookies.delete("fiveam_onboarding");
    return response;
  } catch (caughtError) {
    console.error("Oura callback failed", caughtError);
    void notifyError(
      "/api/auth/oura/callback",
      `Oura callback failed for @${cleanHandle}`,
      caughtError instanceof Error ? caughtError.message : undefined,
    );

    const auth = "sync_failed";
    const detail =
      caughtError instanceof Error ? caughtError.message : "Unknown Oura sync error.";

    const response = NextResponse.redirect(
      buildHomeRedirect(auth, onboarding.nextPath, cleanHandle, detail),
    );
    response.cookies.delete("fiveam_oura_state");
    response.cookies.delete("fiveam_onboarding");
    return response;
  }
}
