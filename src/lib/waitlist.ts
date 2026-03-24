import { createSupabaseAdminClient } from "@/lib/supabase";

type AddToWaitlistInput = {
  twitterHandle: string;
  displayName: string;
  avatarUrl?: string;
};

export async function addToWaitlist(input: AddToWaitlistInput) {
  const supabase = createSupabaseAdminClient();
  const handle = input.twitterHandle.trim().replace(/^@/, "").toLowerCase();

  const { error } = await supabase.from("fiveam_waitlist").upsert(
    {
      twitter_handle: handle,
      display_name: input.displayName,
      avatar_url: input.avatarUrl ?? "",
    },
    { onConflict: "twitter_handle" },
  );

  if (error) {
    console.error("Failed to add to waitlist", error);
  }
}
