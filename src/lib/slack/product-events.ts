import { notifySlack } from "@/lib/slack/notify";

function clean(value: string | null | undefined, max = 180): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function notifyNewSignup(
  name: string | null | undefined,
  handle: string | null | undefined,
): Promise<boolean> {
  const displayName = clean(name, 80) || clean(handle, 80) || "Unknown";
  const parts = [
    "\u{1f389} *New user signed up*",
    `User: ${displayName}`,
  ];
  if (handle) parts.push(`X: @${clean(handle, 40)}`);
  return notifySlack(parts.join("\n"));
}

export async function notifyOuraConnected(
  handle: string,
  name?: string | null,
): Promise<boolean> {
  const displayName = clean(name, 80) || `@${clean(handle, 40)}`;
  return notifySlack(
    `\u{1f4a4} *Oura connected*\nUser: ${displayName} (@${clean(handle, 40)})`,
  );
}

export async function notifySleepSynced(
  handle: string,
  importedDays: number,
  name?: string | null,
): Promise<boolean> {
  const displayName = clean(name, 80) || `@${clean(handle, 40)}`;
  return notifySlack(
    `\u{2600}\u{fe0f} *Sleep history synced*\nUser: ${displayName} (@${clean(handle, 40)})\nDays imported: ${importedDays}`,
  );
}

export async function notifyAccountDeleted(
  handle: string,
): Promise<boolean> {
  return notifySlack(
    `\u{1f44b} *Account deleted*\nUser: @${clean(handle, 40)}`,
  );
}
