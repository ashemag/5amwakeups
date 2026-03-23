import { NextRequest, NextResponse } from "next/server";
import { getStoredMemberStatus } from "@/lib/member-store";

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle")?.trim() ?? "";

  try {
    const status = await getStoredMemberStatus(handle);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Failed to load member status", error);
    return NextResponse.json(
      { error: "Unable to load member status right now." },
      { status: 500 },
    );
  }
}
