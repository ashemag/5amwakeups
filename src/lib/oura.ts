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

type OuraDailySleepResponse = {
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
const OURA_DAILY_SLEEP_URL = "https://api.ouraring.com/v2/usercollection/daily_sleep";
const OURA_SCOPES = ["personal", "daily", "email"];

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Oura request failed with ${response.status}`);
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
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 1);

  const url = new URL(OURA_DAILY_SLEEP_URL);
  url.searchParams.set("start_date", formatDate(start));
  url.searchParams.set("end_date", formatDate(end));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await parseJson<OuraDailySleepResponse>(response);
  const latestSleep = [...payload.data]
    .filter((item) => item.bedtime_end)
    .sort((left, right) =>
      String(right.bedtime_end).localeCompare(String(left.bedtime_end)),
    )[0];

  if (!latestSleep?.bedtime_end) {
    throw new Error(
      "Oura did not return recent sleep data yet. Daily sleep usually lands later in the morning.",
    );
  }

  return {
    wakeDate: latestSleep.day,
    wakeTime: extractClockTime(latestSleep.bedtime_end),
    wakeTimestamp: latestSleep.bedtime_end,
  };
}
