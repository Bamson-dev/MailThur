import { Suspense } from "react";
import InboxConnect from "@/components/dashboard/InboxConnect";

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-12">
      <h1 className="mb-10 text-3xl font-semibold text-gray-900">
        Welcome to your dashboard
      </h1>
      <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
        <InboxConnect />
      </Suspense>
    </main>
  );
}
