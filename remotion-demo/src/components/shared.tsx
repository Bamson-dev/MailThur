import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fontFamily } from "../fonts";
import { theme } from "../theme";

export function useSpringIn(
  delay = 0,
  config: { damping?: number; stiffness?: number } = {}
) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, stiffness: 120, ...config },
  });
}

export function useFadeInOut(
  startIn = 0,
  endOutOffset = 15,
  durationInFrames: number
) {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [startIn, startIn + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - endOutOffset, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return Math.min(fadeIn, fadeOut);
}

export function TitleCard({ title }: { title: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 100 },
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: theme.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          width: 120,
          height: 4,
          backgroundColor: theme.purple,
          marginBottom: 32,
          position: "absolute",
          top: "46%",
          opacity: progress,
          transform: `scaleX(${progress})`,
        }}
      />
      <h1
        style={{
          color: theme.white,
          fontSize: 56,
          fontWeight: 700,
          letterSpacing: -1,
          opacity: progress,
          transform: `translateY(${(1 - progress) * 24}px)`,
        }}
      >
        {title}
      </h1>
    </div>
  );
}

export function NarrationBar({
  text,
  opacity = 1,
  children,
}: {
  text?: string;
  opacity?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 80,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 48px",
        opacity,
        fontFamily,
      }}
    >
      {children ?? (
        <p
          style={{
            color: theme.white,
            fontSize: 18,
            lineHeight: 1.4,
            textAlign: "center",
            margin: 0,
            maxWidth: 1400,
          }}
        >
          {text}
        </p>
      )}
    </div>
  );
}

export function Particles({ count = 24 }: { count?: number }) {
  const frame = useCurrentFrame();
  const items = Array.from({ length: count }, (_, i) => {
    const x = (i * 137.5) % 100;
    const y = (i * 89.3) % 100;
    const drift = Math.sin((frame + i * 12) / 40) * 12;
    const opacity = 0.15 + (i % 5) * 0.05;
    return { x, y, drift, opacity, size: 3 + (i % 4) };
  });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {items.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y + p.drift * 0.05}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: theme.purple,
            opacity: p.opacity,
            filter: "blur(1px)",
          }}
        />
      ))}
    </div>
  );
}

export { fontFamily };
