"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useXAuth } from "@/components/x-auth-provider";
import { useMemberStatus } from "@/lib/use-member-status";
import { getHighQualityXAvatarUrl } from "@/lib/x-avatar";
import {
  formatWakeTime,
  getLeaderboard,
  getQualifyingCount,
  type Member,
} from "@/lib/wake-data";

function getHistoryDotColor(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes <= 300) {
    return "#4f8f63";
  }

  if (totalMinutes <= 315) {
    return "#67986a";
  }

  if (totalMinutes <= 330) {
    return "#7da170";
  }

  if (totalMinutes <= 345) {
    return "#93aa78";
  }

  if (totalMinutes <= 359) {
    return "#a8b480";
  }

  return "#e7c1c1";
}

function JoinFormContent() {
  const router = useRouter();
  const [connectError, setConnectError] = useState("");
  const { isAuthenticating, isLoading, profile, signInWithX } = useXAuth();
  const { isConnected, hasLoadedMembers } = useMemberStatus(
    profile?.username,
  );

  useEffect(() => {
    if (profile && hasLoadedMembers && !isConnected) {
      router.push("/connect-oura");
    }
  }, [profile, hasLoadedMembers, isConnected, router]);

  if (profile) {
    return (
      <div className="mx-auto mt-8 h-10" aria-hidden="true" />
    );
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-xs">
      <Button
        onClick={() => {
          setConnectError("");
          void signInWithX().catch((error: unknown) => {
            setConnectError(
              error instanceof Error
                ? error.message
                : "Unable to start X sign-in.",
            );
          });
        }}
        className="w-full"
        disabled={isLoading || isAuthenticating}
      >
        {isAuthenticating ? "Redirecting..." : "Join the Leaderboard"}
      </Button>

      {connectError && (
        <p className="mt-2 text-center text-[12px] text-destructive">{connectError}</p>
      )}
    </div>
  );
}

export function JoinForm() {
  return (
    <Suspense
      fallback={
        <div className="mt-8 space-y-3">
          <div className="h-8 animate-pulse rounded-lg bg-muted/50" />
          <div className="h-9 animate-pulse rounded-lg bg-muted/50" />
        </div>
      }
    >
      <JoinFormContent />
    </Suspense>
  );
}

function HistoryDots({ member }: { member: Member }) {
  return (
    <>
      {/* Desktop: hover tooltips */}
      <div className="hidden items-center gap-px sm:flex">
        {member.weeklyTimes.map((time, i) => {
          const background = getHistoryDotColor(time);
          return (
            <span
              key={`${member.id}-${i}`}
              className="group relative block"
            >
              <span
                className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md border border-border bg-white px-2 py-1 text-[11px] font-medium whitespace-nowrap text-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-white"
              >
                {formatWakeTime(time)}
              </span>
              <span
                className="block size-1.5 rounded-full"
                style={{ background }}
              />
            </span>
          );
        })}
        {Array.from({
          length: Math.max(0, 7 - member.weeklyTimes.length),
        }).map((_, i) => (
          <span
            key={`${member.id}-empty-${i}`}
            className="group relative block"
          >
            <span
              className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md border border-border bg-white px-2 py-1 text-[11px] font-medium whitespace-nowrap text-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-white"
            >
              No data
            </span>
            <span
              className="block size-1.5 rounded-full bg-muted-foreground/35"
            />
          </span>
        ))}
      </div>

      {/* Mobile: inline dots */}
      <div className="flex items-center gap-px sm:hidden">
        {member.weeklyTimes.map((time, i) => (
          <span
            key={`${member.id}-m-${i}`}
            className="block size-1.5 rounded-full"
            style={{ background: getHistoryDotColor(time) }}
          />
        ))}
        {Array.from({
          length: Math.max(0, 7 - member.weeklyTimes.length),
        }).map((_, i) => (
          <span
            key={`${member.id}-m-empty-${i}`}
            className="block size-1.5 rounded-full bg-muted-foreground/35"
          />
        ))}
      </div>

      {/* Mobile: expanded time list — rendered via MobileExpandedTimes */}
    </>
  );
}

function BoardContent() {
  const [realMembers, setRealMembers] = useState<Member[]>([]);
  const [hasLoadedBoard, setHasLoadedBoard] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { members?: Member[] };
        if (active) {
          setRealMembers(getLeaderboard(payload.members ?? []));
        }
      } catch {
        if (active) {
          setRealMembers([]);
        }
      } finally {
        if (active) {
          setHasLoadedBoard(true);
        }
      }
    }

    void loadLeaderboard();
    return () => {
      active = false;
    };
  }, []);

  const qualifyingCount = getQualifyingCount(realMembers);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
          Leaderboard
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {qualifyingCount} qualified
        </p>
      </div>

      {!hasLoadedBoard ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-muted/50"
            />
          ))}
        </div>
      ) : realMembers.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-white px-5 py-5">
          <p className="text-sm font-medium text-foreground">
            No verified wake times yet.
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            The leaderboard will populate as soon as members connect Oura and sync
            their sleep history.
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border">
          {realMembers.map((member, index) => {
            const isExpanded = expandedId === member.id;

            return (
              <div
                key={member.id}
                className="cursor-pointer py-3 sm:cursor-default"
                onClick={() =>
                  setExpandedId(isExpanded ? null : member.id)
                }
              >
                <div className="flex items-start gap-2.5 sm:items-center sm:gap-4">
                  <span className="w-5 shrink-0 pt-1 text-center text-xs tabular-nums text-muted-foreground sm:pt-0">
                    {index + 1}
                  </span>

                  <a
                    href={`https://x.com/${member.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 pt-0.5 sm:pt-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      className="shrink-0 rounded-full object-cover"
                      src={getHighQualityXAvatarUrl({
                        avatarUrl: member.avatarUrl,
                        username: member.handle,
                      })}
                      alt={member.name}
                      width={32}
                      height={32}
                      quality={100}
                    />
                  </a>

                  <a
                    href={`https://x.com/${member.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 transition-opacity hover:opacity-70"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-medium text-foreground">
                        {member.name}
                      </p>
                      {member.id === "you" && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                          you
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      @{member.handle}
                    </p>
                  </a>

                  <HistoryDots member={member} />

                  <div className="shrink-0 pt-0.5 text-right sm:pt-0">
                    <p className="text-sm tabular-nums font-medium text-foreground">
                      {formatWakeTime(member.wakeTime)}
                    </p>
                    <div className="mt-0.5 flex items-center justify-end">
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {member.streak}d streak
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-1 ml-7 flex flex-wrap gap-x-3 gap-y-1 pb-1 sm:hidden">
                    {member.weeklyTimes.map((time, i) => (
                      <span
                        key={`${member.id}-detail-${i}`}
                        className="flex items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground"
                      >
                        <span
                          className="inline-block size-1.5 rounded-full"
                          style={{ background: getHistoryDotColor(time) }}
                        />
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7]}{" "}
                        {formatWakeTime(time)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Static skeleton placeholder rows */}
          {Array.from({ length: Math.max(0, 8 - realMembers.length) }).map(
            (_, i) => (
              <div
                key={`skeleton-${i}`}
                className="flex items-center gap-2.5 py-3 sm:gap-4"
              >
                <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground/30">
                  {realMembers.length + i + 1}
                </span>
                <div className="size-8 shrink-0 rounded-full bg-muted/60" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3.5 w-24 rounded bg-muted/60" />
                  <div className="h-3 w-16 rounded bg-muted/60" />
                </div>
                <div className="hidden items-center gap-px sm:flex">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <span
                      key={`skel-dot-${i}-${j}`}
                      className="block size-1.5 rounded-full bg-muted/60"
                    />
                  ))}
                </div>
                <div className="shrink-0 space-y-1.5 text-right">
                  <div className="ml-auto h-3.5 w-12 rounded bg-muted/60" />
                  <div className="ml-auto h-3 w-14 rounded bg-muted/60" />
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function Board() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-lg bg-muted/50"
            />
          ))}
        </div>
      }
    >
      <BoardContent />
    </Suspense>
  );
}
