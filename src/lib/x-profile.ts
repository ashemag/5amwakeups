import type { UserIdentity, User } from "@supabase/supabase-js";
import { getHighQualityXAvatarUrl } from "@/lib/x-avatar";

type Metadata = Record<string, unknown>;

export type XProfile = {
  avatarUrl: string | null;
  displayName: string;
  username: string;
};

function readString(candidate: unknown) {
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
}

function sanitizeHandle(candidate: string | null) {
  return candidate?.replace(/^@/, "").trim() || null;
}

function getIdentityData(identity?: UserIdentity): Metadata {
  const data = identity?.identity_data;
  return data && typeof data === "object" ? (data as Metadata) : {};
}

function pickFirstString(keys: string[], sources: Metadata[]) {
  for (const key of keys) {
    for (const source of sources) {
      const value = readString(source[key]);
      if (value) {
        return value;
      }
    }
  }

  return null;
}

export function getXProfile(user: User | null): XProfile | null {
  if (!user) {
    return null;
  }

  const xIdentity = user.identities?.find(
    (identity) => identity.provider === "x" || identity.provider === "twitter",
  );
  const sources = [user.user_metadata as Metadata, getIdentityData(xIdentity)];

  const username = sanitizeHandle(
    pickFirstString(["preferred_username", "user_name", "screen_name", "username"], sources),
  );

  if (!username) {
    return null;
  }

  const displayName =
    pickFirstString(["full_name", "name", "display_name"], sources) ?? username;
  const avatarUrl =
    pickFirstString(["avatar_url", "picture", "picture_url", "profile_image_url"], sources) ??
    null;

  return {
    avatarUrl: getHighQualityXAvatarUrl({ avatarUrl, username }),
    displayName,
    username,
  };
}
