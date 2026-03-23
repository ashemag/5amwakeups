import { Clock3 } from "lucide-react";
import { AccountControls } from "@/components/account-controls";
import { JoinForm, Board } from "@/components/leaderboard-experience";
import { HowItWorks } from "@/components/how-it-works";
import { MainContent } from "@/components/main-content";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col overflow-x-clip px-4 py-5 sm:px-5 sm:py-6">
      {/* Header: small clock left, sign-in right */}
      <div className="relative z-10 -mx-1 flex items-center justify-between gap-3 px-1 sm:-mx-5">
        <div className="flex min-w-0 items-center gap-1">
          <Clock3 className="size-5 shrink-0 text-muted-foreground sm:size-6" strokeWidth={0.8} />
          <span className="truncate text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:text-[11px] sm:tracking-[0.35em]">
            The 5AM Club
          </span>
        </div>
        <AccountControls />
      </div>

      <MainContent>
        <Board />

        <JoinForm />

        <HowItWorks />
      </MainContent>

      <footer className="relative z-10 mt-8 pb-2 text-center font-sans text-[13px] text-muted-foreground/60">
        Made with 🤍 by{" "}
        <a
          href="https://x.com/ashebytes"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition-colors hover:text-muted-foreground"
        >
          @ashebytes
        </a>
      </footer>
    </main>
  );
}
