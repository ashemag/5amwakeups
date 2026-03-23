import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, fetchLatestWakeSnapshot, fetchOuraPersonalInfo } from "@/lib/oura";
import { upsertStoredMember } from "@/lib/member-store";

type OnboardingCookie = {
  handle?: string;
  name?: string;
};

function buildHomeRedirect(request: NextRequest, auth: string, handle?: string) {
  const url = new URL("/", request.url);
  url.searchParams.set("auth", auth);

  if (handle) {
    url.searchParams.set("handle", handle);
  }

  return url;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
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
    const response = NextResponse.redirect(
      buildHomeRedirect(request, "denied", cleanHandle),
    );
    response.cookies.delete("fiveam_oura_state");
    response.cookies.delete("fiveam_onboarding");
    return response;
  }

  if (!code || !returnedState || returnedState !== storedState) {
    const response = NextResponse.redirect(
      buildHomeRedirect(request, "invalid_state", cleanHandle),
    );
    response.cookies.delete("fiveam_oura_state");
    response.cookies.delete("fiveam_onboarding");
    return response;
  }

  if (!cleanHandle) {
    const response = NextResponse.redirect(buildHomeRedirect(request, "missing_handle"));
    response.cookies.delete("fiveam_oura_state");
    response.cookies.delete("fiveam_onboarding");
    return response;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const [personalInfo, wakeSnapshot] = await Promise.all([
      fetchOuraPersonalInfo(tokens.access_token),
      fetchLatestWakeSnapshot(tokens.access_token),
    ]);

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await upsertStoredMember({
      accessToken: tokens.access_token,
      displayName: onboarding.name?.trim() || cleanHandle,
      email: personalInfo.email ?? null,
      ouraUserId: personalInfo.id,
      refreshToken: tokens.refresh_token,
      scopes: grantedScopes.split(" ").filter(Boolean),
      tokenExpiresAt,
      twitterHandle: cleanHandle,
      wakeDate: wakeSnapshot.wakeDate,
      wakeTime: wakeSnapshot.wakeTime,
      wakeTimestamp: wakeSnapshot.wakeTimestamp,
    });

    const response = NextResponse.redirect(
      buildHomeRedirect(request, "connected", cleanHandle),
    );
    response.cookies.delete("fiveam_oura_state");
    response.cookies.delete("fiveam_onboarding");
    return response;
  } catch (caughtError) {
    console.error("Oura callback failed", caughtError);

    const message =
      caughtError instanceof Error &&
      caughtError.message.includes("did not return recent sleep data")
        ? "missing_sleep"
        : "sync_failed";

    const response = NextResponse.redirect(
      buildHomeRedirect(request, message, cleanHandle),
    );
    response.cookies.delete("fiveam_oura_state");
    response.cookies.delete("fiveam_onboarding");
    return response;
  }
}
