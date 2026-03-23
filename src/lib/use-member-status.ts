"use client";

import { useEffect, useState } from "react";
import type { Member } from "@/lib/wake-data";

export function useMemberStatus(handle?: string | null) {
  const [connectedMember, setConnectedMember] = useState<Member | null>(null);
  const [hasSleepData, setHasSleepData] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasLoadedMembers, setHasLoadedMembers] = useState(false);

  useEffect(() => {
    const normalizedHandle = handle?.trim().replace(/^@/, "") ?? "";

    if (!normalizedHandle) {
      setConnectedMember(null);
      setHasSleepData(false);
      setIsConnected(false);
      setHasLoadedMembers(true);
      return;
    }

    let active = true;
    setConnectedMember(null);
    setHasSleepData(false);
    setIsConnected(false);
    setHasLoadedMembers(false);

    async function loadMemberStatus() {
      try {
        const url = new URL("/api/member-status", window.location.origin);
        url.searchParams.set("handle", normalizedHandle);
        const response = await fetch(url.toString(), { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          connected?: boolean;
          hasSleepData?: boolean;
          member?: Member | null;
        };

        if (active) {
          setConnectedMember(payload.member ?? null);
          setHasSleepData(Boolean(payload.hasSleepData));
          setIsConnected(Boolean(payload.connected));
        }
      } catch {
        if (active) {
          setConnectedMember(null);
          setHasSleepData(false);
          setIsConnected(false);
        }
      } finally {
        if (active) {
          setHasLoadedMembers(true);
        }
      }
    }

    void loadMemberStatus();

    return () => {
      active = false;
    };
  }, [handle]);

  return {
    connectedMember,
    hasSleepData,
    hasLoadedMembers,
    isConnected,
  };
}
