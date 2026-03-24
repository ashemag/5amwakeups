import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { buildOuraAuthorizeUrl } from "@/lib/oura";
import { getConnectedMemberCount, isHandleAlreadyConnected } from "@/lib/member-store";
import { addToWaitlist } from "@/lib/waitlist";
import { getHighQualityXAvatarUrl } from "@/lib/x-avatar";
import { notifyWaitlisted } from "@/lib/slack/product-events";

const OURA_MAX_USERS = 10;

export async function GET(request: NextRequest) {
  const avatarUrl = request.nextUrl.searchParams.get("avatar_url")?.trim() ?? "";
  const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";
  const nextPath = request.nextUrl.searchParams.get("next")?.trim() ?? "/";
  const handle =
    request.nextUrl.searchParams.get("handle")?.trim().replace(/^@/, "") ?? "";

  if (!handle) {
    return NextResponse.redirect(new URL("/?auth=missing_handle", env.appUrl));
  }

  // Allow reconnects for existing members, but block new connections at capacity
  const alreadyConnected = await isHandleAlreadyConnected(handle);

  if (!alreadyConnected) {
    const count = await getConnectedMemberCount();

    if (count >= OURA_MAX_USERS) {
      await addToWaitlist({
        twitterHandle: handle,
        displayName: name || handle,
        avatarUrl: getHighQualityXAvatarUrl({ avatarUrl, username: handle }),
      });

      void notifyWaitlisted(handle, name || handle);

      const redirectUrl = new URL(nextPath.startsWith("/") ? nextPath : "/", env.appUrl);
      redirectUrl.searchParams.set("auth", "waitlisted");
      return NextResponse.redirect(redirectUrl);
    }
  }

  const state = randomBytes(24).toString("hex");
  const authorizeUrl = buildOuraAuthorizeUrl(state);

  if (process.env.NODE_ENV !== "production") {
    console.info("Oura authorize redirect", {
      authorizeUrl,
      handle,
    });
  }

  const response = NextResponse.redirect(authorizeUrl);

  response.cookies.set("fiveam_oura_state", state, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  response.cookies.set(
    "fiveam_onboarding",
    JSON.stringify({
      handle,
      avatarUrl,
      name,
      nextPath,
    }),
    {
      httpOnly: true,
      maxAge: 60 * 10,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  );

  return response;
}
