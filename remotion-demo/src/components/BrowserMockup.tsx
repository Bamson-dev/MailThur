import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFamily } from "../fonts";
import { theme } from "../theme";

export function BrowserMockup({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: 1500,
        height: 860,
        borderRadius: 16,
        overflow: "hidden",
        border: `1px solid ${theme.border}`,
        boxShadow: "0 40px 120px rgba(0,0,0,0.55)",
        backgroundColor: theme.card,
        fontFamily,
      }}
    >
      <div
        style={{
          height: 52,
          backgroundColor: "#0A0C14",
          borderBottom: `1px solid ${theme.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {["#EF4444", "#F59E0B", "#10B981"].map((c) => (
            <div
              key={c}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: c,
              }}
            />
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, color: theme.muted, fontSize: 14 }}>
          <span>←</span>
          <span>→</span>
          <span>↻</span>
        </div>
        <div
          style={{
            flex: 1,
            height: 32,
            borderRadius: 8,
            backgroundColor: theme.bg,
            border: `1px solid ${theme.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            color: theme.muted,
            fontSize: 15,
          }}
        >
          🔒 {url}
        </div>
      </div>
      <div
        style={{
          height: 808,
          backgroundColor: theme.bg,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function AnimatedCursor({
  x,
  y,
  clicking = false,
  visible = true,
}: {
  x: number;
  y: number;
  clicking?: boolean;
  visible?: boolean;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clickPulse = clicking
    ? spring({
        frame,
        fps,
        config: { damping: 200, stiffness: 300 },
      })
    : 1;

  const scale = clicking ? interpolate(clickPulse, [0, 1], [0.82, 1]) : 1;

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 100,
        pointerEvents: "none",
        transform: `scale(${scale})`,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.45))",
      }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M4 3L4 22L10 16L14 24L17 22L13 14L20 14L4 3Z"
          fill="#FFFFFF"
          stroke="#111827"
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}

export function MailThurLogo({ size = 64 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${theme.purple}, #5B21B6)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.white,
          fontWeight: 700,
          fontSize: size * 0.45,
          fontFamily,
        }}
      >
        M
      </div>
      <span
        style={{
          color: theme.white,
          fontSize: size * 0.65,
          fontWeight: 700,
          fontFamily,
          letterSpacing: -1,
        }}
      >
        MailThur
      </span>
    </div>
  );
}

export function SidebarMock() {
  const items = [
    "Dashboard",
    "Campaigns",
    "Inboxes",
    "Contacts",
    "Analytics",
    "Billing",
    "Settings",
  ];
  return (
    <div
      style={{
        width: 220,
        height: "100%",
        borderRight: `1px solid ${theme.border}`,
        background: `linear-gradient(180deg, ${theme.bg}, #111420)`,
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      <MailThurLogo size={36} />
      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <div
            key={item}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 14,
              color: i === 2 ? theme.white : theme.muted,
              backgroundColor: i === 2 ? "rgba(124,58,237,0.15)" : "transparent",
              border: i === 2 ? `1px solid rgba(124,58,237,0.35)` : "1px solid transparent",
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PurpleButton({
  label,
  width = 220,
  highlight = false,
}: {
  label: string;
  width?: number;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        width,
        padding: "12px 20px",
        borderRadius: 10,
        backgroundColor: highlight ? theme.purple : "rgba(124,58,237,0.15)",
        border: `1px solid ${theme.purple}`,
        color: theme.white,
        fontSize: 15,
        fontWeight: 600,
        textAlign: "center",
        boxShadow: highlight ? "0 0 30px rgba(124,58,237,0.35)" : "none",
      }}
    >
      {label}
    </div>
  );
}
