"use client";

import { useXAuth } from "@/components/x-auth-provider";

const steps = [
  {
    number: "01",
    title: "Sign in",
    body: "Sign in with X so your profile is ready for the board.",
  },
  {
    number: "02",
    title: "Connect Oura",
    body: "Finish onboarding on a dedicated Oura page and verify your wake data.",
  },
  {
    number: "03",
    title: "Compete",
    body: "Climb the board. Closer to 5:00 means higher score, greener rank.",
  },
];

export function HowItWorks() {
  const { profile } = useXAuth();

  if (profile) {
    return null;
  }

  return (
    <section className="relative z-10 mt-10">
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
        How it works
      </p>
      <div className="mt-6 grid w-full gap-6 sm:grid-cols-3 sm:gap-6">
        {steps.map((step) => (
          <div key={step.number} className="mx-auto max-w-xs text-center">
            <p className="font-heading text-2xl tracking-tight text-foreground/10 font-light">
              {step.number}
            </p>
            <h3 className="mt-2 text-[13px] font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
