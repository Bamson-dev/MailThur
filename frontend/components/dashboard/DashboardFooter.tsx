import Link from "next/link";

export default function DashboardFooter() {
  return (
    <footer className="mt-12 border-t border-border-subtle pt-6 pb-8">
      <div className="flex flex-col items-start justify-between gap-4 text-sm text-muted sm:flex-row sm:items-center">
        <p>© 2026 MailThur · Pdigital Marketstore Ltd</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
          <Link href="/about" className="hover:text-white">
            About
          </Link>
          <a href="mailto:support@mailthur.com" className="hover:text-white">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
}
