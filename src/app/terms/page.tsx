import { Clock3 } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for The 5AM Club.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-5 sm:px-5 sm:py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <Clock3
            className="size-5 shrink-0 text-muted-foreground sm:size-6"
            strokeWidth={0.8}
          />
          <span className="truncate text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground sm:text-[11px] sm:tracking-[0.35em]">
            The 5AM Club
          </span>
        </div>
        <Link
          href="/"
          className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Back home
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 items-center py-10 sm:py-14">
        <article className="w-full rounded-3xl border border-border bg-card px-6 py-7 shadow-[0_2px_24px_rgba(0,0,0,0.04)] sm:px-8 sm:py-9 dark:shadow-none">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Terms of Service
          </p>
          <h1 className="mt-3 font-heading text-3xl tracking-[-0.04em] text-foreground sm:text-4xl">
            Simple terms for using Fiveam Club.
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Effective date: March 23, 2026
          </p>

          <div className="mt-8 space-y-7 text-[15px] leading-7 text-muted-foreground">
            <section>
              <h2 className="font-heading text-lg text-foreground">
                Using the service
              </h2>
              <p className="mt-2">
                By using Fiveam Club, you agree to use the service lawfully and
                not to misuse, disrupt, reverse engineer, or interfere with the
                app or other users.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground">
                Accounts and integrations
              </h2>
              <p className="mt-2">
                You are responsible for the external accounts you connect,
                including X and Oura. If those services are unavailable or their
                data is delayed, Fiveam Club may not function as expected.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground">
                Content and data
              </h2>
              <p className="mt-2">
                You retain ownership of your content and connected account data.
                You grant Fiveam Club permission to use that information only as
                needed to operate the service and display leaderboard results.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground">
                No guarantees
              </h2>
              <p className="mt-2">
                Fiveam Club is provided on an &quot;as is&quot; and &quot;as available&quot;
                basis. We do not guarantee uninterrupted access, perfect data
                accuracy, or permanent availability.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground">
                Changes
              </h2>
              <p className="mt-2">
                We may update or discontinue parts of the service and may revise
                these terms from time to time by posting an updated version.
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
