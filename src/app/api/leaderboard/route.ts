import { NextResponse } from "next/server";
import { listStoredMembers } from "@/lib/member-store";

export async function GET() {
  try {
    const members = await listStoredMembers();
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Failed to load leaderboard members", error);
    return NextResponse.json(
      { error: "Unable to load the leaderboard right now." },
      { status: 500 },
    );
  }
}
