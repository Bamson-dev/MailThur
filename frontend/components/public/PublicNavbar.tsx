import Link from "next/link";

export default function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle/60 bg-[#0D0F1A]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          MailThur
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="/#features" className="text-sm text-body hover:text-white">
            Features
          </a>
          <a href="/#pricing" className="text-sm text-body hover:text-white">
            Pricing
          </a>
          <Link href="/about" className="text-sm text-body hover:text-white">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden text-sm text-body hover:text-white sm:inline"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </header>
  );
}
