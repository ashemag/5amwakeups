import { Clock3 } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Fiveam Club",
  description: "Privacy policy for Fiveam Club.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </p>
          <h1 className="mt-3 font-heading text-3xl tracking-[-0.04em] text-foreground sm:text-4xl">
            A lightweight privacy policy.
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Effective date: March 23, 2026
          </p>

          <div className="mt-8 space-y-7 text-[15px] leading-7 text-muted-foreground">
            <section>
              <h2 className="font-heading text-lg text-foreground">
                What we collect
              </h2>
              <p className="mt-2">
                Fiveam Club collects the basic account and sleep data needed to
                run the product, including your X profile details, your Oura
                connection details, and verified wake-time data made available
                through Oura.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground">
                How we use it
              </h2>
              <p className="mt-2">
                We use this information to authenticate your account, import
                wake-time history, display your profile on the leaderboard, and
                operate the app.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground">
                Sharing
              </h2>
              <p className="mt-2">
                We do not sell your personal data. We may rely on service
                providers such as Supabase, Oura, X, and hosting providers to
                run the service.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground">
                Retention and deletion
              </h2>
              <p className="mt-2">
                We keep your account data only as long as needed to operate the
                service. If you delete your account, we will remove your profile
                and stored leaderboard data from the app, subject to any legal
                or operational retention requirements.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg text-foreground">
                Contact
              </h2>
              <p className="mt-2">
                If you have questions about this policy, contact the operator of
                Fiveam Club through the contact method listed on the website or
                app.
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
