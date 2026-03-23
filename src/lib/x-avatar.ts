type XAvatarInput = {
  avatarUrl?: string | null;
  username?: string | null;
};

function sanitizeUsername(username?: string | null) {
  return username?.trim().replace(/^@/, "") || null;
}

export function getFallbackXAvatarUrl(username?: string | null) {
  const handle = sanitizeUsername(username);
  return handle ? `https://unavatar.io/x/${handle}` : null;
}

export function getHighQualityXAvatarUrl({
  avatarUrl,
  username,
}: XAvatarInput) {
  const fallback = getFallbackXAvatarUrl(username);
  const source = avatarUrl?.trim() || fallback;

  if (!source) {
    return "";
  }

  if (!source.includes("pbs.twimg.com/profile_images/")) {
    return source;
  }

  return source.replace(
    /_(?:normal|bigger|mini|200x200|400x400)(\.(?:jpg|jpeg|png|webp|gif))(\?.*)?$/i,
    "_400x400$1$2",
  );
}
