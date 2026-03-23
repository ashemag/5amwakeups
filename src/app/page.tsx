import { LeaderboardExperience } from "@/components/leaderboard-experience";

const signals = [
  "Verified by Oura wake events",
  "Ranked by exact wake precision",
  "Avatar pulled from X username",
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-8 sm:px-8 lg:px-10">
      <section className="rounded-[2.5rem] border border-black/8 bg-[rgba(250,247,241,0.8)] px-6 py-7 shadow-[0_20px_80px_rgba(43,33,22,0.06)] backdrop-blur sm:px-8 lg:px-10">
        <div className="flex flex-col gap-5 border-b border-black/6 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[0.68rem] uppercase tracking-[0.42em] text-stone-500">
              Fiveam club
            </p>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-none tracking-[-0.05em] text-stone-950 sm:text-6xl lg:text-7xl">
              Social accountability for people who actually get up early.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
              A minimalist leaderboard built around one ritual: wake up in the
              `5:00` hour, get verified by Oura, and earn status with a cleaner,
              greener board the closer you are to `5:00 AM`.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:max-w-xl">
            {signals.map((signal) => (
              <div
                key={signal}
                className="rounded-full border border-black/8 bg-white/80 px-4 py-3 text-center text-sm text-stone-700"
              >
                {signal}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <LeaderboardExperience />
        </div>
      </section>
    </main>
  );
}
