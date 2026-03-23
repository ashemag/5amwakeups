import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { buildOuraAuthorizeUrl } from "@/lib/oura";

export async function GET(request: NextRequest) {
  const avatarUrl = request.nextUrl.searchParams.get("avatar_url")?.trim() ?? "";
  const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";
  const nextPath = request.nextUrl.searchParams.get("next")?.trim() ?? "/";
  const handle =
    request.nextUrl.searchParams.get("handle")?.trim().replace(/^@/, "") ?? "";

  if (!handle) {
    return NextResponse.redirect(new URL("/?auth=missing_handle", env.appUrl));
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
