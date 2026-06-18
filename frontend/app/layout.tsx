import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MailThur — Connect your inboxes",
  description:
    "MailThur connects your inboxes so you can focus on what matters. We handle the rest.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
