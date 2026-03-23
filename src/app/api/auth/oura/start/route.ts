import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildOuraAuthorizeUrl } from "@/lib/oura";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";
  const handle =
    request.nextUrl.searchParams.get("handle")?.trim().replace(/^@/, "") ?? "";

  if (!handle) {
    return NextResponse.redirect(new URL("/?auth=missing_handle", request.url));
  }

  const state = randomBytes(24).toString("hex");
  const response = NextResponse.redirect(buildOuraAuthorizeUrl(state));

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
      name,
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
