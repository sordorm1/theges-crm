import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AppDataProvider } from "@/lib/data/store-context";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "the GES | CRM тестового центра",
  description: "Внутренняя система учёта учеников, партнёров и экзаменов the GES",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppDataProvider>
          <TooltipProvider>
            <AppShell>{children}</AppShell>
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </AppDataProvider>
      </body>
    </html>
  );
}
