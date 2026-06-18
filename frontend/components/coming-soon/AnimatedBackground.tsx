"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
}

function createParticles(count: number, width: number, height: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.8 + 0.6,
    speedY: Math.random() * 0.35 + 0.12,
    speedX: (Math.random() - 0.5) * 0.15,
    opacity: Math.random() * 0.35 + 0.08,
  }));
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesRef.current = createParticles(
        55,
        window.innerWidth,
        window.innerHeight
      );
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const particle of particlesRef.current) {
        particle.y -= particle.speedY;
        particle.x += particle.speedX + mouse.x * 0.02;

        if (particle.y < -10) {
          particle.y = h + 10;
          particle.x = Math.random() * w;
        }
        if (particle.x < -10) {
          particle.x = w + 10;
        }
        if (particle.x > w + 10) {
          particle.x = -10;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${particle.opacity})`;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [mouse.x, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [prefersReducedMotion]);

  const parallaxX = prefersReducedMotion ? 0 : mouse.x * 18;
  const parallaxY = prefersReducedMotion ? 0 : mouse.y * 12;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-[-20%]"
        style={{ x: parallaxX * 0.3, y: parallaxY * 0.3 }}
      >
        <div className="mailthur-gradient-layer h-full w-full" />
      </motion.div>

      <motion.div
        className="absolute inset-0"
        style={{ x: parallaxX * -0.8, y: parallaxY * -0.6 }}
      >
        <div className="mailthur-aurora-blob absolute -left-1/4 top-1/4 h-[55vh] w-[55vw] rounded-full bg-violet-600/30 blur-[100px]" />
      </motion.div>
      <motion.div
        className="absolute inset-0"
        style={{ x: parallaxX * 0.9, y: parallaxY * 0.7 }}
      >
        <div
          className="mailthur-aurora-blob absolute -right-1/4 bottom-1/4 h-[50vh] w-[50vw] rounded-full bg-indigo-600/25 blur-[110px]"
          style={{ animationDelay: "4s" }}
        />
      </motion.div>
      <motion.div
        className="absolute inset-0"
        style={{ x: parallaxX * 0.5, y: parallaxY * -0.4 }}
      >
        <div className="mailthur-aurora-blob absolute left-1/3 top-1/2 h-[35vh] w-[35vw] rounded-full bg-blue-500/20 blur-[90px]" />
      </motion.div>

      {!prefersReducedMotion ? (
        <canvas ref={canvasRef} className="absolute inset-0 opacity-80" />
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,3,15,0.65)_70%,rgba(5,3,15,0.95)_100%)]" />
    </div>
  );
}
