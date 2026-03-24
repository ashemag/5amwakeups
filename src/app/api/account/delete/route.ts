import { NextRequest, NextResponse } from "next/server";
import { getXProfile } from "@/lib/x-profile";
import {
  createSupabaseAdminClient,
  createSupabaseServerAuthClient,
} from "@/lib/supabase";
import { notifyError } from "@/lib/slack/notify";
import { notifyAccountDeleted } from "@/lib/slack/product-events";

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const authClient = createSupabaseServerAuthClient();
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const profile = getXProfile(user);
    const handle = profile?.username?.trim().replace(/^@/, "").toLowerCase();

    if (!handle) {
      return NextResponse.json(
        { error: "No X profile is associated with this account." },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();

    const { error: memberError } = await supabase
      .from("fiveam_members")
      .delete()
      .eq("twitter_handle", handle);

    if (memberError) {
      console.error("Failed to delete member row", memberError);
      return NextResponse.json(
        { error: "Failed to delete member data." },
        { status: 500 },
      );
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

    if (authError) {
      console.error("Failed to delete auth user", authError);
      return NextResponse.json(
        { error: "Failed to delete auth account." },
        { status: 500 },
      );
    }

    void notifyAccountDeleted(handle);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion failed", error);
    void notifyError(
      "/api/account/delete",
      "Account deletion failed",
      error instanceof Error ? error.message : undefined,
    );
    return NextResponse.json(
      { error: "Unable to delete account right now." },
      { status: 500 },
    );
  }
}
