"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  formatWakeTime,
  getLeaderboard,
  getQualifyingCount,
  getWakeStatus,
  sampleMembers,
  type Member,
} from "@/lib/wake-data";

const statCopy = [
  { label: "live members", value: "1,284" },
  { label: "perfect 5:00s today", value: "146" },
  { label: "average streak", value: "12 days" },
];

const authMessages: Record<string, string> = {
  connected: "Oura connected. Your latest verified wake time is now on the board.",
  denied: "Oura access was denied before the connection completed.",
  invalid_state: "The Oura auth session expired. Start the connection again.",
  missing_handle: "Add your X username first so Fiveam can attach your public avatar.",
  missing_sleep:
    "Oura connected, but no recent daily sleep summary was available yet. Try again later this morning.",
  sync_failed: "The Oura sync completed with an error. Please try the connection again.",
};

function LeaderboardExperienceContent() {
  const searchParams = useSearchParams();
  const returnedHandle = searchParams.get("handle")?.replace(/^@/, "") ?? "";
  const [name, setName] = useState("Asha");
  const [handle, setHandle] = useState(returnedHandle || "ashamornings");
  const [realMembers, setRealMembers] = useState<Member[]>([]);
  const [connectError, setConnectError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { members?: Member[] };

        if (active && payload.members?.length) {
          setRealMembers(getLeaderboard(payload.members));
        }
      } catch {
        // Keep the polished sample board as a fallback when persistence is empty.
      }
    }

    void loadLeaderboard();

    return () => {
      active = false;
    };
  }, []);

  const normalizedHandle = handle.trim().replace(/^@/, "");
  const liveMembers = realMembers.length ? realMembers : getLeaderboard(sampleMembers);
  const connectedMember = useMemo(
    () =>
      realMembers.find(
        (member) => member.handle.toLowerCase() === normalizedHandle.toLowerCase(),
      ),
    [normalizedHandle, realMembers],
  );
  const previewStatus = connectedMember
    ? getWakeStatus(connectedMember.wakeTime)
    : null;
  const qualifyingCount = getQualifyingCount(liveMembers);
  const authState = searchParams.get("auth");
  const authMessage = authState ? authMessages[authState] : "";

  const handleConnect = () => {
    if (!normalizedHandle) {
      setConnectError("Add your X username before starting Oura auth.");
      return;
    }

    setConnectError("");

    const url = new URL("/api/auth/oura/start", window.location.origin);
    url.searchParams.set("name", name.trim());
    url.searchParams.set("handle", normalizedHandle);
    window.location.assign(url.toString());
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="overflow-hidden rounded-[2rem] border border-black/8 bg-white/92 shadow-[0_30px_80px_rgba(22,18,14,0.08)] backdrop-blur">
        <div className="border-b border-black/6 px-6 py-5 sm:px-8">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-stone-500">
            Live board preview
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <h2 className="font-serif text-4xl tracking-[-0.03em] text-stone-950 sm:text-5xl">
                Fiveam turns early wakeups into a social sport.
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-600 sm:text-base">
                Connect Oura for verified wake times, add your X username for your
                public avatar, and compete on a board that rewards precision near
                5:00 AM.
              </p>
            </div>

            <div className="grid gap-3 sm:min-w-[220px]">
              {statCopy.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-black/6 bg-stone-50/80 px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.75rem] border border-black/6 bg-[#f6f2eb] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  Join today
                </p>
                <h3 className="mt-2 font-serif text-3xl tracking-[-0.03em] text-stone-950">
                  Onboard in under a minute
                </h3>
              </div>
              <span className="rounded-full border border-black/8 bg-white/80 px-3 py-1 text-xs text-stone-600">
                {connectedMember ? "Oura linked" : "Awaiting Oura"}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {authMessage ? (
                <div className="rounded-[1.25rem] border border-black/8 bg-white/70 px-4 py-3 text-sm leading-6 text-stone-700">
                  {authMessage}
                </div>
              ) : null}

              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-stone-500">
                  Full name
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-stone-500">
                  X username
                </span>
                <input
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400"
                  value={handle}
                  onChange={(event) => {
                    setHandle(event.target.value.replace(/\s+/g, ""));
                    setConnectError("");
                  }}
                  placeholder="@yourhandle"
                />
              </label>

              <button
                type="button"
                onClick={handleConnect}
                className="w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
              >
                {connectedMember ? "Reconnect Oura Ring" : "Connect Oura Ring"}
              </button>

              {connectError ? (
                <p className="text-sm leading-6 text-[#9a5a4e]">{connectError}</p>
              ) : null}

              <p className="text-sm leading-6 text-stone-600">
                Your X username gives Fiveam a public avatar. Your wake time comes
                from Oura&apos;s verified daily sleep summary, then the board scores
                everyone from `5:00` to `5:59`, with greener ranks closer to
                `5:00`.
              </p>
            </div>

            {connectedMember && previewStatus ? (
              <div
                className="mt-5 rounded-[1.5rem] border px-4 py-4"
                style={{
                  background: previewStatus.surface,
                  borderColor: previewStatus.border,
                }}
              >
                <div className="flex items-center gap-3">
                  <Image
                    className="rounded-full border border-white/70 object-cover shadow-sm"
                    src={connectedMember.avatarUrl}
                    alt={`${connectedMember.name} avatar`}
                    width={48}
                    height={48}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-950">
                      {connectedMember.name}
                    </p>
                    <p className="truncate text-sm text-stone-600">
                      @{connectedMember.handle}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-stone-700">
                    Latest verified wake: {formatWakeTime(connectedMember.wakeTime)}
                  </p>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      color: previewStatus.accent,
                      background: "rgba(255,255,255,0.75)",
                    }}
                  >
                    {previewStatus.label}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[1.5rem] border border-black/8 bg-white/70 px-4 py-4">
                <p className="text-sm font-medium text-stone-950">
                  Real auth path
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  The Oura callback now exchanges a real code, fetches your latest
                  daily sleep summary, and stores your verified wake time in
                  Supabase.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-black/6 bg-stone-950 p-5 text-stone-50">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-400">
                  Today&apos;s leaderboard
                </p>
                <h3 className="mt-2 font-serif text-3xl tracking-[-0.03em]">
                  {qualifyingCount} people made the window
                </h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-stone-300">
                Verified by Oura wake event
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {liveMembers.map((member, index) => {
                const status = getWakeStatus(member.wakeTime);

                return (
                  <article
                    key={member.id}
                    className="rounded-[1.5rem] border border-white/8 bg-white/6 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-sm font-medium text-stone-200">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <Image
                        className="rounded-full object-cover"
                        src={member.avatarUrl}
                        alt={`${member.name} avatar`}
                        width={48}
                        height={48}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-white">
                            {member.name}
                          </p>
                          {member.id === "you" ? (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-stone-300">
                              you
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-sm text-stone-400">
                          @{member.handle} · {member.city}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {formatWakeTime(member.wakeTime)}
                        </p>
                        <p className="text-xs text-stone-400">
                          {member.streak} day streak
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="space-y-2">
                        <div className="h-2 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(status.score, 8)}%`,
                              background: status.accent,
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {member.weeklyTimes.map((time, dayIndex) => {
                            const dot = getWakeStatus(time);

                            return (
                              <span
                                key={`${member.id}-${dayIndex}`}
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: dot.accent }}
                                title={formatWakeTime(time)}
                              />
                            );
                          })}
                        </div>
                      </div>

                      <div
                        className="rounded-full border px-3 py-1 text-xs font-medium"
                        style={{
                          color: status.accent,
                          background: status.surface,
                          borderColor: status.border,
                        }}
                      >
                        {status.qualifies ? `${Math.round(status.score)} pts` : "missed"}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6">
        <article className="rounded-[2rem] border border-black/8 bg-white/90 p-6 shadow-[0_20px_60px_rgba(22,18,14,0.06)]">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-stone-500">
            Scoring logic
          </p>
          <div className="mt-5 space-y-4">
            {[
              {
                title: "Green if you hit 5:00 or earlier",
                body: "Perfect wakeups get maximum points and sit at the top of the board.",
              },
              {
                title: "5:01 to 5:15 still scores strongly",
                body: "You stay qualified, but the bar softens from green to olive as minutes drift.",
              },
              {
                title: "After 5:45 the pressure kicks in",
                body: "You still count until 5:59, but the board makes lateness visible.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.5rem] bg-stone-50 px-4 py-4">
                <h4 className="text-sm font-medium text-stone-950">{item.title}</h4>
                <p className="mt-2 text-sm leading-6 text-stone-600">{item.body}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-black/8 bg-[#ebe6dc] p-6">
          <p className="text-[0.65rem] uppercase tracking-[0.35em] text-stone-500">
            Product loop
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-stone-700">
            <p>1. Member joins with Oura and X handle.</p>
            <p>2. Oura verifies wake event every morning.</p>
            <p>3. Board refreshes with streaks, color ranking, and social proof.</p>
            <p>4. Group chat, flexing rights, and streak protection keep the habit alive.</p>
          </div>
        </article>
      </section>
    </div>
  );
}

export function LeaderboardExperience() {
  return (
    <Suspense
      fallback={
        <div className="rounded-[2rem] border border-black/8 bg-white/92 px-6 py-10 text-sm text-stone-600 shadow-[0_30px_80px_rgba(22,18,14,0.08)]">
          Loading Fiveam leaderboard...
        </div>
      }
    >
      <LeaderboardExperienceContent />
    </Suspense>
  );
}
