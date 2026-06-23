import PublicFooter from "./PublicFooter";
import PublicNavbar from "./PublicNavbar";

export default function PublicPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0D0F1A] text-white">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
