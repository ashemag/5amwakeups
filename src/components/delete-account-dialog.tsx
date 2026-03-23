"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useXAuth } from "@/components/x-auth-provider";

type DeleteAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteAccountDialog({
  open,
  onOpenChange,
}: DeleteAccountDialogProps) {
  const router = useRouter();
  const { profile, session, user, signOut } = useXAuth();
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const username = profile?.username ?? "";
  const isConfirmed = confirmation === username;

  const handleDelete = async () => {
    if (!isConfirmed || !user) return;

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Deletion failed.");
      }

      await signOut();
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete account.",
      );
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setConfirmation("");
      setError("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogDescription>
          This will permanently remove your profile, Oura connection, and all
          sleep data from the leaderboard. This action cannot be undone.
        </DialogDescription>

        <div className="mt-5">
          <label
            htmlFor="delete-confirmation"
            className="block text-[13px] text-muted-foreground"
          >
            Type{" "}
            <span className="font-semibold text-foreground">{username}</span> to
            confirm
          </label>
          <input
            id="delete-confirmation"
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={username}
            autoComplete="off"
            spellCheck={false}
            className="mt-2 h-10 w-full rounded-lg border border-border bg-background px-3 font-sans text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-ring focus:ring-1 focus:ring-ring"
          />
        </div>

        {error && (
          <p className="mt-3 text-[12px] text-destructive">{error}</p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <DialogClose
            render={
              <Button
                variant="outline"
                className="w-full sm:flex-1"
                disabled={isDeleting}
              />
            }
          >
            Cancel
          </DialogClose>
          <Button
            variant="destructive"
            className="w-full sm:flex-1"
            disabled={!isConfirmed || isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? "Deleting..." : "Delete account"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
