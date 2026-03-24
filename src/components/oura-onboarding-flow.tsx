"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { useXAuth } from "@/components/x-auth-provider";
import { useMemberStatus } from "@/lib/use-member-status";
import { formatWakeTime } from "@/lib/wake-data";
import { getHighQualityXAvatarUrl } from "@/lib/x-avatar";

const authMessages: Record<string, string> = {
  connected: "Oura connected. We are importing your recent sleep history now.",
  denied: "Oura access was denied.",
  invalid_state: "Session expired. Try connecting again.",
  missing_handle: "Add your X username first.",
  missing_sleep:
    "Oura connected, but no completed sleep summary is available yet.",
  oura_error: "Oura rejected the request.",
  sync_failed: "Sync error. Please try again.",
  waitlisted:
    "We're at capacity for Oura connections right now (pending Oura's approval for more slots). You've been added to the waitlist — we'll ping you when a spot opens up!",
};

function StepIcon({
  state,
}: {
  state: "completed" | "active" | "pending";
}) {
  if (state === "completed") {
    return (
      <div className="flex size-6 items-center justify-center rounded-full bg-foreground">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="text-background"
        >
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`flex size-6 items-center justify-center rounded-full border-[1.5px] border-dashed ${
        state === "active" ? "border-foreground/40" : "border-muted-foreground/25"
      }`}
    />
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`text-muted-foreground/50 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function OuraOnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, profile } = useXAuth();
  const { connectedMember, hasSleepData, isConnected } = useMemberStatus(
    profile?.username,
  );
  const authState = searchParams.get("auth");
  const authMessage = authState ? authMessages[authState] : "";
  const authDetail = searchParams.get("auth_detail")?.trim() ?? "";
  const [connectError, setConnectError] = useState("");

  const shouldRedirectHome =
    (!isLoading && !profile) || (profile && isConnected && !authState);

  useEffect(() => {
    if (shouldRedirectHome) {
      router.replace("/");
    }
  }, [shouldRedirectHome, router]);

  useEffect(() => {
    if (!authState) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    url.searchParams.delete("auth_detail");
    url.searchParams.delete("handle");
    window.history.replaceState({}, "", url.pathname);
  }, [authState]);

  // Determine current step
  const xSignedIn = !!profile;
  const ouraConnected = isConnected;

  const currentStep = !xSignedIn ? 0 : !ouraConnected ? 1 : 2;

  const [openStep, setOpenStep] = useState<number | null>(null);

  // Keep the active step open by default
  useEffect(() => {
    setOpenStep(currentStep);
  }, [currentStep]);

  const handleConnect = () => {
    if (!profile) {
      setConnectError("Sign in with X first.");
      return;
    }

    setConnectError("");
    const url = new URL("/api/auth/oura/start", window.location.origin);
    url.searchParams.set(
      "avatar_url",
      getHighQualityXAvatarUrl({
        avatarUrl: profile.avatarUrl,
        username: profile.username,
      }),
    );
    url.searchParams.set("handle", profile.username);
    url.searchParams.set("name", profile.displayName);
    url.searchParams.set("next", "/connect-oura");
    window.location.assign(url.toString());
  };

  const toggleStep = (step: number) => {
    setOpenStep(openStep === step ? null : step);
  };

  // Don't render anything while loading or while redirecting away — this
  // prevents the onboarding card from flashing on screen.
  if (isLoading || shouldRedirectHome) {
    return null;
  }

  const activeProfile = profile;
  const displayName = activeProfile?.displayName ?? "there";

  return (
    <div className="w-full max-w-lg">
      {authMessage ? (
        <div className="mb-4 rounded-xl border border-border bg-card px-4 py-3 font-sans text-[13px] text-muted-foreground">
          <p>{authMessage}</p>
          {authDetail ? (
            <p className="mt-1 text-xs text-muted-foreground/70">
              {authDetail}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card px-4 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)] sm:px-6 sm:py-6 dark:shadow-none">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-semibold tracking-[-0.01em] text-foreground">
            Hello, {displayName}!
          </h1>
          <p className="mt-0.5 font-sans text-[14px] text-muted-foreground">
            Let&apos;s get you on the leaderboard.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {/* Step 1: Sign in with X */}
          <div className="rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => toggleStep(0)}
              className="flex w-full items-center gap-3 px-3 py-3.5 text-left sm:px-4"
            >
              <StepIcon
                state={
                  xSignedIn ? "completed" : currentStep === 0 ? "active" : "pending"
                }
              />
              <span className="flex-1 text-[14px] font-medium text-foreground">
                Sign in with X
              </span>
              <ChevronIcon open={openStep === 0} />
            </button>

            {openStep === 0 && (
              <div className="px-3 pb-4 pt-0 sm:px-4">
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
                  <Image
                    className="size-8 rounded-full object-cover"
                    src={getHighQualityXAvatarUrl({
                      avatarUrl: activeProfile?.avatarUrl,
                      username: activeProfile?.username ?? "x",
                    })}
                    alt={activeProfile?.displayName ?? "X profile"}
                    width={32}
                    height={32}
                    quality={100}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {activeProfile?.displayName}
                    </p>
                    <p className="truncate font-sans text-xs text-muted-foreground">
                      @{activeProfile?.username}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Connect Oura */}
          <div className="rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => toggleStep(1)}
              className="flex w-full flex-wrap items-center gap-2 px-3 py-3.5 text-left sm:flex-nowrap sm:gap-3 sm:px-4"
            >
              <StepIcon
                state={
                  ouraConnected
                    ? "completed"
                    : currentStep === 1
                      ? "active"
                      : "pending"
                }
              />
              <span className="flex-1 text-[14px] font-medium text-foreground">
                Connect your Oura ring
              </span>
              {ouraConnected && (
                <span className="text-[12px] font-medium text-[#5b8f5f]">
                  Connected
                </span>
              )}
              <ChevronIcon open={openStep === 1} />
            </button>

            {openStep === 1 && (
              <div className="px-3 pb-4 pt-0 sm:px-4">
                {ouraConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
                      {connectedMember ? (
                        <Image
                          className="size-8 rounded-full object-cover"
                          src={getHighQualityXAvatarUrl({
                            avatarUrl: connectedMember.avatarUrl,
                            username: connectedMember.handle,
                          })}
                          alt={connectedMember.name}
                          width={32}
                          height={32}
                          quality={100}
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">
                          {connectedMember?.name ??
                            activeProfile?.displayName ??
                            "Connected"}
                        </p>
                        <p className="truncate font-sans text-xs text-muted-foreground">
                          {hasSleepData && connectedMember
                            ? `Latest verified wake time: ${formatWakeTime(connectedMember.wakeTime)}`
                            : "Connected. Waiting for Oura sleep summaries to finish syncing."}
                        </p>
                      </div>
                    </div>
                    <p className="font-sans text-[13px] leading-relaxed text-muted-foreground">
                      Need to refresh permissions or fix a sync issue? You can
                      reconnect Oura at any time.
                    </p>
                  </div>
                ) : (
                  <p className="font-sans text-[13px] leading-relaxed text-muted-foreground">
                    We&apos;ll verify your wake times directly from Oura so they
                    appear on the leaderboard.
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 font-sans">
          {ouraConnected ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={handleConnect}
                className="h-10 w-full rounded-lg font-sans text-[13px]"
                disabled={isLoading}
              >
                Reconnect Oura
              </Button>
              <Link
                href="/"
                className={buttonVariants({
                  className: "h-10 w-full rounded-lg text-[13px]",
                })}
              >
                Continue
              </Link>
            </div>
          ) : (
            <Button
              onClick={handleConnect}
              className="h-10 w-full rounded-lg font-sans text-[13px]"
              disabled={isLoading}
            >
              Connect Oura
            </Button>
          )}
          {connectError ? (
            <p className="mt-2 text-center text-[12px] text-destructive">
              {connectError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
