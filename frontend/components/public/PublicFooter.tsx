import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border-subtle bg-[#0D0F1A]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-lg font-bold text-white">MailThur</p>
            <p className="mt-2 max-w-sm text-sm text-body">
              Professional cold email outreach from your own inbox
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted">
              Legal
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-body hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-body hover:text-white">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-body hover:text-white">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted">
              Support
            </p>
            <p className="mt-4 text-sm">
              <a
                href="mailto:support@mailthur.com"
                className="text-body hover:text-white"
              >
                support@mailthur.com
              </a>
            </p>
            <p className="mt-4 text-sm text-muted">
              Pdigital Marketstore Ltd
              <br />
              RC 8015428
              <br />
              Lagos, Nigeria
            </p>
          </div>
        </div>

        <p className="mt-10 border-t border-border-subtle pt-6 text-center text-xs text-muted">
          © 2026 MailThur. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
