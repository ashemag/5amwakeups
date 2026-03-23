"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useXAuth } from "@/components/x-auth-provider";
import { useTheme } from "@/components/theme-provider";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { getHighQualityXAvatarUrl } from "@/lib/x-avatar";

type AccountControlsProps = {
  compact?: boolean;
};

export function AccountControls({ compact = false }: AccountControlsProps) {
  const router = useRouter();
  const { isAuthenticating, isLoading, profile, signInWithX, signOut } =
    useXAuth();
  const { theme, setTheme } = useTheme();
  const [authError, setAuthError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const cycleTheme = () => {
    const order: Array<"light" | "dark" | "system"> = [
      "light",
      "dark",
      "system",
    ];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const themeLabel =
    theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  if (isLoading) {
    return (
      <div
        className={`${compact ? "h-9 w-24" : "h-10 w-28"} animate-pulse rounded-lg bg-muted`}
      />
    );
  }

  if (profile) {
    const avatarUrl = getHighQualityXAvatarUrl({
      avatarUrl: profile.avatarUrl,
      username: profile.username,
    });
    const firstName = profile.displayName.split(" ")[0];

    return (
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="lg"
              className={
                compact
                  ? "h-9 max-w-[11rem] gap-2 px-2.5 text-sm sm:px-3"
                  : "h-10 max-w-[12rem] gap-2 px-3 text-sm sm:gap-2.5 sm:px-3.5"
              }
            />
          }
        >
          <Image
            className={`${compact ? "size-6" : "size-7"} rounded-full object-cover`}
            src={avatarUrl}
            alt={profile.displayName}
            width={compact ? 24 : 28}
            height={compact ? 24 : 28}
            quality={100}
          />
          <span className="truncate">{firstName}</span>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          sideOffset={compact ? 6 : 8}
          className="w-40 max-w-[calc(100vw-1rem)] rounded-xl border-border/60 bg-popover p-1 shadow-lg ring-0"
        >
          <button
            type="button"
            onClick={cycleTheme}
            className="w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Theme: {themeLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthError("");
              void signOut()
                .then(() => {
                  router.replace("/");
                })
                .catch((error: unknown) => {
                  setAuthError(
                    error instanceof Error
                      ? error.message
                      : "Unable to sign out.",
                  );
                });
            }}
            className="w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Sign out
          </button>
          <div className="my-0.5 h-px bg-border" />
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-[13px] text-destructive transition-colors hover:bg-destructive/10"
          >
            Delete account
          </button>

          {authError && (
            <p className="px-2.5 pb-1 text-xs text-destructive">{authError}</p>
          )}
        </PopoverContent>

        <DeleteAccountDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        />
      </Popover>
    );
  }

  return (
    <div className="flex max-w-full flex-wrap items-center justify-end gap-2 self-start">
      <Button
        size={compact ? "icon-sm" : "icon"}
        variant="ghost"
        onClick={cycleTheme}
        aria-label={`Theme: ${themeLabel}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-muted-foreground"
        >
          {theme === "dark" ? (
            <path
              d="M8 3a1 1 0 0 1 0-2 1 1 0 0 1 0 2Zm0 12a1 1 0 0 1 0-2 1 1 0 0 1 0 2ZM3 8a1 1 0 0 1-2 0 1 1 0 0 1 2 0Zm12 0a1 1 0 0 1-2 0 1 1 0 0 1 2 0ZM4.22 4.22a1 1 0 0 1-1.42-1.42 1 1 0 0 1 1.42 1.42Zm8.98 8.98a1 1 0 0 1-1.42-1.42 1 1 0 0 1 1.42 1.42ZM4.22 11.78a1 1 0 0 1-1.42 1.42 1 1 0 0 1 1.42-1.42Zm8.98-8.98a1 1 0 0 1-1.42 1.42 1 1 0 0 1 1.42-1.42ZM10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
              fill="currentColor"
            />
          ) : theme === "light" ? (
            <path
              d="M13.36 10.06a5.5 5.5 0 0 1-7.42-7.42A6 6 0 1 0 13.36 10.06Z"
              fill="currentColor"
            />
          ) : (
            <path
              d="M8 1.5a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 8 1.5ZM8 5a3 3 0 0 0 0 6V5ZM12.25 8a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1A.75.75 0 0 1 12.25 8ZM8 11.75a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1A.75.75 0 0 1 8 11.75ZM2 8a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1A.75.75 0 0 1 2 8Z"
              fill="currentColor"
            />
          )}
        </svg>
      </Button>
      <Button
        size="lg"
        className={compact ? "h-9 px-3 text-sm" : "h-10 max-w-full px-3 text-sm sm:px-3.5"}
        variant="outline"
        onClick={() => {
          setAuthError("");
          void signInWithX().catch((error: unknown) => {
            setAuthError(
              error instanceof Error
                ? error.message
                : "Unable to start X sign-in.",
            );
          });
        }}
        disabled={isLoading || isAuthenticating}
      >
        {isAuthenticating ? "Redirecting..." : "Sign in"}
      </Button>
      {authError ? (
        <p className="w-full text-right text-[12px] text-destructive">
          {authError}
        </p>
      ) : null}
    </div>
  );
}
