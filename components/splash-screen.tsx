"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function SplashScreen() {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#0f2b57]"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="rounded-3xl bg-white/95 p-6 shadow-2xl shadow-black/30"
      >
        <Image src="/logo.png" alt="the GES" width={96} height={96} priority />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="flex flex-col items-center gap-3"
      >
        <span className="text-sm font-medium tracking-[0.3em] text-white/70 uppercase">
          the GES
        </span>
        <span className="h-1 w-40 overflow-hidden rounded-full bg-white/15">
          <motion.span
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            className="block h-full w-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500"
          />
        </span>
      </motion.div>
    </motion.div>
  );
}
