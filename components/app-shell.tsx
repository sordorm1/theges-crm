"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Loader2, AlertTriangle } from "lucide-react";
import { SplashScreen } from "@/components/splash-screen";
import { Sidebar } from "@/components/sidebar";
import { useAppData } from "@/lib/data/store-context";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const MIN_SPLASH_MS = 1000;
const MAX_SPLASH_MS = 2000;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, error } = useAppData();
  const [minTimeDone, setMinTimeDone] = useState(false);
  const [maxTimeDone, setMaxTimeDone] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setMinTimeDone(true), MIN_SPLASH_MS);
    const t2 = setTimeout(() => setMaxTimeDone(true), MAX_SPLASH_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const showSplash = !((ready && minTimeDone) || maxTimeDone);

  return (
    <>
      <AnimatePresence>{showSplash && <SplashScreen />}</AnimatePresence>

      <div className="flex min-h-screen w-full">
        <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
          <div className="sticky top-0 h-screen">
            <Sidebar />
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-border bg-card/60 px-4 py-3 backdrop-blur lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu className="size-5" />
            </Button>
            <Image src="/logo.png" alt="the GES" width={24} height={24} />
            <span className="text-sm font-bold">the GES</span>
          </header>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-64 border-none p-0">
              <SheetTitle className="sr-only">Меню навигации</SheetTitle>
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <motion.main
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: showSplash ? 0 : 1, y: showSplash ? 8 : 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="flex-1 bg-background px-4 py-6 sm:px-6 lg:px-8"
          >
            {error ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
                <AlertTriangle className="size-5" />
                Не удалось загрузить данные: {error}
              </div>
            ) : ready ? (
              children
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            )}
          </motion.main>
        </div>
      </div>
    </>
  );
}
