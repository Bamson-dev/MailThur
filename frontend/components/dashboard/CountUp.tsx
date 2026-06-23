"use client";

import { useEffect, useState } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
}

export default function CountUp({
  value,
  duration = 1000,
  decimals = 0,
  suffix = "",
}: CountUpProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = value;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString();

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
}
