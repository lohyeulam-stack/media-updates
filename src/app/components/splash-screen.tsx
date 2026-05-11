"use client"

import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { PLATFORM_META } from "@/lib/types"

export function SplashScreen() {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [activeLogIndex, setActiveLogIndex] = useState(0)

  const platforms = useMemo(() => Object.values(PLATFORM_META).slice(0, 12), [])

  const logs = useMemo(
    () => [
      "BOOT_SEQUENCE_ALPHA_READY",
      "NODE_ESTABLISHED: 22_POINTS",
      "ENCRYPTED_HANDSHAKE_COMPLETE",
      "FETCHING_GLOBAL_INDICES...",
      "SYNCING_TIKTOK_ALGO_VECTOR",
      "AGGREGATING_META_POLICY_DATA",
      "CALIBRATING_TREND_SENSORS",
      "ISOLATING_MARKET_SIGNALS",
      "RECONSTRUCTING_MEDIA_REALITY",
      "INEVITABILITY_CONFIRMED",
      "SYSTEMS_NOMINAL",
    ],
    []
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(() => setIsVisible(false), 1200)
          return 100
        }
        const step = Math.floor(Math.random() * 8) + 2
        return Math.min(prev + step, 100)
      })
      setActiveLogIndex((prev) => (prev + 1) % logs.length)
    }, 120)
    return () => clearInterval(timer)
  }, [logs])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{
            clipPath: "inset(0 0 100% 0)",
            transition: { duration: 1.2, ease: [0.85, 0, 0.15, 1] },
          }}
          className="fixed inset-0 z-[100] bg-brand-black text-brand-white flex flex-col justify-between p-8 lg:p-16 overflow-hidden select-none"
        >
          {/* LAYER 1: grid backdrop */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="h-full w-full bg-[radial-gradient(#ffffff22_1px,transparent_1px)] bg-[size:3vw_3vw]" />
          </div>

          {/* LAYER 2: top metadata bar */}
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex gap-12">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-blue">
                  Core Status
                </div>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-green-500"
                  />
                  <span className="text-[10px] font-mono opacity-60">
                    SYSTEM_LIVE_{new Date().getFullYear()}
                  </span>
                </div>
              </div>

              <div className="hidden md:block space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
                  Active Nodes
                </div>
                <div className="flex gap-1">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, progress > i * 8 ? 12 : 4, 4] }}
                      transition={{ repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-white/20"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="text-right font-mono text-[9px] opacity-40">
              <div>LATENCY: 14MS</div>
              <div>UPTIME: 100.00%</div>
              <div>V:1.4.2_STABLE</div>
            </div>
          </div>

          {/* LAYER 3: central kinetic typography */}
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-[15vw] font-bold tracking-[-0.08em] leading-[0.8] uppercase"
              >
                Media
                <span className="italic text-brand-blue normal-case">Updates</span>
              </motion.h1>
            </div>

            <div className="mt-8 flex flex-col items-start gap-1">
              <div className="text-[10px] font-mono tracking-widest text-brand-blue/80 bg-brand-blue/5 px-2 py-0.5 border border-brand-blue/20">
                &gt; {logs[activeLogIndex]}
              </div>
              <div className="flex gap-4 flex-wrap">
                {platforms.map((p, i) => (
                  <motion.div
                    key={p.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: progress > i * 8 ? 0.3 : 0 }}
                    className="text-[8px] font-mono uppercase"
                  >
                    [{p.label.substring(0, 3).toUpperCase()}]
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* LAYER 4: bottom progress */}
          <div className="relative z-10 flex items-end justify-between">
            <div className="flex flex-col gap-6 w-full max-w-sm">
              <div className="text-[10px] font-bold uppercase tracking-[0.6em] opacity-40">
                TopTou Product Intelligence
              </div>
              <div className="relative h-px bg-white/10 w-full overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-brand-blue origin-left"
                  style={{ scaleX: progress / 100 }}
                />
              </div>
              <p className="text-xs font-light leading-relaxed tracking-tight text-white/40 max-w-xs">
                Tracking product, API, and policy shifts across the {platforms.length}+ core
                advertising platforms TopTou watches every day.
              </p>
            </div>

            <div className="flex flex-col items-end">
              <motion.div
                key={progress}
                className="text-[12vw] font-bold tracking-tighter leading-none mb-[-1.5vw]"
              >
                {progress.toString().padStart(3, "0")}
              </motion.div>
              <div className="text-[10px] font-bold uppercase tracking-[0.5em] opacity-40 flex items-center gap-3">
                <div className="w-8 h-px bg-white/20" /> Initializing
              </div>
            </div>
          </div>

          {/* LAYER 5: scan line */}
          <motion.div
            animate={{
              top: ["0%", "100%"],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-40 bg-gradient-to-b from-transparent via-brand-blue/5 to-transparent z-0 pointer-events-none"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
