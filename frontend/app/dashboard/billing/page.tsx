import { Suspense } from "react";
import { Skeleton } from "@/components/dashboard/Skeleton";
import BillingPage from "./BillingPageClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div>
          <Skeleton className="mb-6 h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <BillingPage />
    </Suspense>
  );
}
