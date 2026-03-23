import { env } from "@/lib/env";

type OuraTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope?: string;
  token_type: string;
};

type OuraPersonalInfo = {
  id: string;
  age?: number | null;
  biological_sex?: string | null;
  email?: string | null;
  height?: number | null;
  weight?: number | null;
};

type OuraSleepResponse = {
  data: Array<{
    bedtime_end?: string | null;
    bedtime_start?: string | null;
    day: string;
    id: string;
    score?: number | null;
  }>;
  next_token?: string | null;
};

type WakeSnapshot = {
  wakeDate: string;
  wakeTime: string;
  wakeTimestamp: string;
};

const OURA_AUTHORIZE_URL = "https://cloud.ouraring.com/oauth/authorize";
const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";
const OURA_PERSONAL_INFO_URL = "https://api.ouraring.com/v2/usercollection/personal_info";
const OURA_SLEEP_URL = "https://api.ouraring.com/v2/usercollection/sleep";
const OURA_SCOPES = ["personal", "daily", "email"];

function formatOuraErrorMessage(response: Response, detail: string) {
  const trimmedDetail = detail.trim();

  if (!trimmedDetail) {
    return `Oura request failed with ${response.status}`;
  }

  try {
    const parsed = JSON.parse(trimmedDetail) as {
      detail?: string;
      error?: string;
      error_description?: string;
      title?: string;
    };

    return (
      parsed.error_description ||
      parsed.detail ||
      parsed.title ||
      parsed.error ||
      trimmedDetail
    );
  } catch {
    return trimmedDetail;
  }
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(formatOuraErrorMessage(response, detail));
  }

  return (await response.json()) as T;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function extractClockTime(timestamp: string) {
  const match = timestamp.match(/T(\d{2}):(\d{2})/);

  if (!match) {
    throw new Error("Oura wake timestamp did not include a local clock time.");
  }

  return `${match[1]}:${match[2]}`;
}

export function buildOuraAuthorizeUrl(state: string) {
  const url = new URL(OURA_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.ouraClientId);
  url.searchParams.set("redirect_uri", env.ouraRedirectUri);
  url.searchParams.set("scope", OURA_SCOPES.join(" "));
  url.searchParams.set("state", state);

  return url.toString();
}

export async function exchangeCodeForTokens(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.ouraRedirectUri,
    client_id: env.ouraClientId,
    client_secret: env.ouraClientSecret,
  });

  const response = await fetch(OURA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  return parseJson<OuraTokenResponse>(response);
}

export async function fetchOuraPersonalInfo(accessToken: string) {
  const response = await fetch(OURA_PERSONAL_INFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  return parseJson<OuraPersonalInfo>(response);
}

export async function fetchLatestWakeSnapshot(accessToken: string): Promise<WakeSnapshot> {
  const snapshots = await fetchRecentWakeSnapshots(accessToken, 30);
  const latestSleep = snapshots[0];

  if (!latestSleep) {
    throw new Error(
      "Oura did not return recent sleep data yet. Daily sleep usually lands later in the morning.",
    );
  }

  return latestSleep;
}

export async function fetchRecentWakeSnapshots(
  accessToken: string,
  daysBack = 30,
): Promise<WakeSnapshot[]> {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - daysBack);

  const url = new URL(OURA_SLEEP_URL);
  url.searchParams.set("start_date", formatDate(start));
  url.searchParams.set("end_date", formatDate(end));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await parseJson<OuraSleepResponse>(response);
  return [...payload.data]
    .filter((item) => item.bedtime_end)
    .sort((left, right) =>
      String(right.bedtime_end).localeCompare(String(left.bedtime_end)),
    )
    .map((sleep) => ({
      wakeDate: sleep.day,
      wakeTime: extractClockTime(String(sleep.bedtime_end)),
      wakeTimestamp: String(sleep.bedtime_end),
    }));
}
