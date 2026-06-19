import { Suspense } from "react";
import BillingSection from "@/components/dashboard/BillingSection";
import InboxConnect from "@/components/dashboard/InboxConnect";
import InboxHealth from "@/components/dashboard/InboxHealth";
import Campaigns from "@/components/dashboard/Campaigns";

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-12">
      <h1 className="mb-10 text-3xl font-semibold text-gray-900">
        Welcome to your dashboard
      </h1>
      <div className="flex w-full max-w-4xl flex-col gap-16">
        <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
          <InboxConnect />
        </Suspense>
        <InboxHealth />
        <BillingSection />
        <Campaigns />
      </div>
    </main>
  );
}
