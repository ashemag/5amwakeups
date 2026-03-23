import { AccountControls } from "@/components/account-controls";
import { OuraOnboardingFlow } from "@/components/oura-onboarding-flow";

export const dynamic = "force-dynamic";

export default function ConnectOuraPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background font-heading">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-7 sm:py-5">
        <div className="flex justify-end">
          <AccountControls compact />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-7 sm:pb-12">
        <OuraOnboardingFlow />
      </div>
    </main>
  );
}
