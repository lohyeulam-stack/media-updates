"use client"

import React, { useEffect, useRef, useState } from "react"

type Phase = "init" | "reveal" | "pulse" | "exit" | "done"

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("init")
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion.current) {
      setPhase("done")
      return
    }
    const t1 = setTimeout(() => setPhase("reveal"), 100)
    const t2 = setTimeout(() => setPhase("pulse"), 800)
    const t3 = setTimeout(() => setPhase("exit"), 2800)
    const t4 = setTimeout(() => setPhase("done"), 3800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  if (phase === "done") return null

  const revealed = phase !== "init"
  const pulsing = phase === "pulse" || phase === "exit"
  const exiting = phase === "exit"

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: "#000000",
        opacity: exiting ? 0 : 1,
        transition: exiting ? "opacity 1s cubic-bezier(0.4,0,0.2,1)" : "none",
        pointerEvents: exiting ? "none" : "auto",
      }}
      aria-hidden="true"
    >
      <BackgroundGradients active={revealed} />
      <ParticleField active={pulsing} />

      <div className="relative flex flex-col items-center select-none" style={{ gap: "clamp(24px, 4vh, 48px)" }}>
        <HeroLogo revealed={revealed} pulsing={pulsing} />
        <LoadingIndicator revealed={revealed} pulsing={pulsing} />
      </div>

      <BorderDecoration revealed={revealed} />
    </div>
  )
}

function BackgroundGradients({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute rounded-full"
        style={{
          width: "60vw",
          height: "60vh",
          left: "30%",
          top: "20%",
          background: "radial-gradient(ellipse, rgba(8,174,234,0.15) 0%, transparent 70%)",
          filter: "blur(80px)",
          opacity: active ? 1 : 0,
          transform: active ? "scale(1)" : "scale(0.8)",
          transition: "opacity 1.2s ease, transform 1.2s ease",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "50vw",
          height: "50vh",
          left: "60%",
          top: "60%",
          background: "radial-gradient(ellipse, rgba(42,245,152,0.12) 0%, transparent 70%)",
          filter: "blur(90px)",
          opacity: active ? 1 : 0,
          transform: active ? "scale(1)" : "scale(0.8)",
          transition: "opacity 1.4s ease 0.2s, transform 1.4s ease 0.2s",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: "40vw",
          height: "40vh",
          left: "10%",
          top: "70%",
          background: "radial-gradient(ellipse, rgba(255,90,205,0.1) 0%, transparent 70%)",
          filter: "blur(70px)",
          opacity: active ? 1 : 0,
          transform: active ? "scale(1)" : "scale(0.8)",
          transition: "opacity 1.6s ease 0.4s, transform 1.6s ease 0.4s",
        }}
      />
    </div>
  )
}

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
}

function ParticleField({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!active || startedRef.current) return
    startedRef.current = true

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    particlesRef.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.02,
      speedY: (Math.random() - 0.5) * 0.02,
      opacity: Math.random() * 0.3 + 0.1,
    }))

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    const draw = () => {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const particles = particlesRef.current
      for (const p of particles) {
        p.x += p.speedX
        p.y += p.speedY
        if (p.x < -2) p.x = 102
        if (p.x > 102) p.x = -2
        if (p.y < -2) p.y = 102
        if (p.y > 102) p.y = -2

        const px = (p.x / 100) * window.innerWidth
        const py = (p.y / 100) * window.innerHeight

        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      startedRef.current = false
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: active ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}
    />
  )
}

function HeroLogo({ revealed, pulsing }: { revealed: boolean; pulsing: boolean }) {
  const title = "Media Updates"

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div
        className="absolute"
        style={{
          width: "clamp(500px, 80vw, 1100px)",
          height: "clamp(250px, 35vh, 500px)",
          background: "radial-gradient(ellipse at center, rgba(8,174,234,0.2) 0%, rgba(42,245,152,0.1) 40%, transparent 70%)",
          filter: "blur(80px)",
          opacity: revealed ? 0.9 : 0,
          transform: revealed ? "scale(1)" : "scale(0.6)",
          transition: "opacity 1.4s ease, transform 1.4s cubic-bezier(0.34,1.56,0.64,1)",
          animation: pulsing ? "logo-glow 3s ease-in-out infinite" : "none",
        }}
      />

      <div
        className="relative flex overflow-hidden"
        aria-label={title}
        style={{ gap: "0.05em" }}
      >
        {title.split("").map((char, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontSize: "clamp(32px, 12vw, 160px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.9) 40%, rgba(8,174,234,0.95) 70%, rgba(42,245,152,0.9) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontFamily: "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, sans-serif)",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(40px)",
              transition: `opacity 0.7s ease ${0.2 + i * 0.04}s, transform 0.7s cubic-bezier(0.34,1.56,0.64,1) ${0.2 + i * 0.04}s`,
              whiteSpace: char === " " ? "pre" : "normal",
              textShadow: "0 0 60px rgba(8,174,234,0.4), 0 0 100px rgba(42,245,152,0.25)",
            }}
          >
            {char === " " ? " " : char}
          </span>
        ))}
      </div>

      <p
        style={{
          fontSize: "clamp(13px, 2.2vw, 18px)",
          fontWeight: 500,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "rgba(148,163,184,0.75)",
          marginTop: "clamp(16px, 2.5vh, 32px)",
          opacity: revealed ? 1 : 0,
          transform: revealed ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.7s ease 1.3s, transform 0.7s ease 1.3s",
        }}
      >
        TopTou · Product Intelligence
      </p>
    </div>
  )
}

function LoadingIndicator({ revealed, pulsing }: { revealed: boolean; pulsing: boolean }) {
  return (
    <div
      className="flex flex-col items-center gap-4"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.5s ease 1.5s, transform 0.5s ease 1.5s",
      }}
    >
      <div
        style={{
          width: "clamp(180px, 28vw, 260px)",
          height: "2px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, #08AEEA 0%, #2AF598 50%, #FF5ACD 100%)",
            transformOrigin: "left center",
            transform: pulsing ? "scaleX(1)" : "scaleX(0)",
            transition: pulsing ? "transform 1.8s cubic-bezier(0.4,0,0.2,1) 0.2s" : "none",
          }}
        />
      </div>

      <p
        style={{
          fontSize: "11px",
          fontWeight: 400,
          letterSpacing: "0.05em",
          color: "rgba(100,116,139,0.7)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        Loading experience
      </p>
    </div>
  )
}

function BorderDecoration({ revealed }: { revealed: boolean }) {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: "1px solid rgba(255,255,255,0.05)",
          opacity: revealed ? 1 : 0,
          transition: "opacity 0.8s ease 0.5s",
        }}
      />

      {[
        { top: 24, left: 24, rotate: 0 },
        { top: 24, right: 24, rotate: 90 },
        { bottom: 24, right: 24, rotate: 180 },
        { bottom: 24, left: 24, rotate: 270 },
      ].map((pos, i) => {
        const style: React.CSSProperties = {
          width: 24,
          height: 24,
          opacity: revealed ? 0.3 : 0,
          transform: `rotate(${pos.rotate}deg) ${revealed ? "scale(1)" : "scale(0.6)"}`,
          transition: `opacity 0.5s ease ${0.8 + i * 0.1}s, transform 0.5s ease ${0.8 + i * 0.1}s`,
        }
        if ("top" in pos) style.top = pos.top
        if ("bottom" in pos) style.bottom = pos.bottom
        if ("left" in pos) style.left = pos.left
        if ("right" in pos) style.right = pos.right

        return (
          <div key={i} className="absolute pointer-events-none" style={style}>
            <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
              <path d="M2 12 L2 2 L12 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )
      })}
    </>
  )
}
