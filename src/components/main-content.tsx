"use client";

import type { ReactNode } from "react";
import { useXAuth } from "@/components/x-auth-provider";

export function MainContent({ children }: { children: ReactNode }) {
  const { profile } = useXAuth();

  return (
    <div
      className={`relative z-10 flex-1 py-12 ${profile ? "" : "flex flex-col justify-center"}`}
    >
      {children}
    </div>
  );
}
