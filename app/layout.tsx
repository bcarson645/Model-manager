import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { Inter } from "next/font/google";
import { AppClerkShell } from "@/components/auth/AppClerkShell";
import { clerkPublishableKey } from "@/lib/auth/clerk-keys";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Model Manager",
  description: "Prompt-driven interface builder for model management",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  noStore();
  const publishableKey = clerkPublishableKey() ?? "";

  return (
    <html lang="en">
      <body className={inter.className}>
        <AppClerkShell publishableKey={publishableKey}>{children}</AppClerkShell>
      </body>
    </html>
  );
}
