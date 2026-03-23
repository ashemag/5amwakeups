"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useXAuth } from "@/components/x-auth-provider";
import { formatWakeTime, type Member } from "@/lib/wake-data";
import { getHighQualityXAvatarUrl } from "@/lib/x-avatar";

type OuraConnectPanelProps = {
  connectedMember: Member | null;
  returnPath?: string;
};

export function OuraConnectPanel({
  connectedMember,
  returnPath = "/connect-oura",
}: OuraConnectPanelProps) {
  const { profile } = useXAuth();
  const [connectError, setConnectError] = useState("");

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
    url.searchParams.set("next", returnPath);
    window.location.assign(url.toString());
  };

  return (
    <div>
      {connectedMember && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <Image
            className="rounded-full object-cover"
            src={getHighQualityXAvatarUrl({
              avatarUrl: connectedMember.avatarUrl,
              username: connectedMember.handle,
            })}
            alt={connectedMember.name}
            width={28}
            height={28}
            quality={100}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">
              {connectedMember.name}
            </p>
            <p className="truncate font-sans text-xs text-muted-foreground">
              Latest: {formatWakeTime(connectedMember.wakeTime)}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">Connected</Badge>
        </div>
      )}

      {profile ? (
        <div className="rounded-[1.75rem] border border-border bg-card px-4 py-5 sm:px-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Signed in with X
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Image
              className="size-10 rounded-full object-cover"
              src={getHighQualityXAvatarUrl({
                avatarUrl: profile.avatarUrl,
                username: profile.username,
              })}
              alt={profile.displayName}
              width={40}
              height={40}
              quality={100}
            />
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">
                {profile.displayName}
              </p>
              <p className="truncate font-sans text-xs text-muted-foreground">
                @{profile.username}
              </p>
            </div>
          </div>
          <Button
            onClick={handleConnect}
            size="lg"
            className="mt-5 h-11 w-full rounded-full px-5 font-sans"
          >
            {connectedMember ? "Reconnect Oura" : "Connect Oura"}
          </Button>
        </div>
      ) : null}

      {connectError ? (
        <p className="mt-3 font-sans text-[13px] text-destructive">{connectError}</p>
      ) : null}
    </div>
  );
}
