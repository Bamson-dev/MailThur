import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  AnimatedCursor,
  BrowserMockup,
  PurpleButton,
} from "../components/BrowserMockup";
import { TitleCard } from "../components/shared";
import { TITLE_FRAMES, theme } from "../theme";
import { fontFamily } from "../fonts";

function LandingContent() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const url =
    frame < 220 ? "www.mailthur.com" : "www.mailthur.com/dashboard";

  const cursorX = interpolate(
    frame,
    [60, 120, 140, 180],
    [900, 760, 760, 760],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const cursorY = interpolate(
    frame,
    [60, 120, 140, 180],
    [500, 420, 420, 420],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const clicking = frame >= 140 && frame < 155;

  const slide = spring({
    frame: frame - 190,
    fps,
    config: { damping: 200, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <div
        style={{
          transform: `translateX(${(1 - slide) * 120}px)`,
          opacity: frame < 190 ? 1 : interpolate(slide, [0, 1], [1, 0.3]),
        }}
      >
        <BrowserMockup url={url}>
          {frame < 190 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <div
                style={{
                  background:
                    "radial-gradient(ellipse at top, rgba(124,58,237,0.2), transparent 60%)",
                  padding: "40px 20px",
                }}
              >
                <h1
                  style={{
                    color: theme.white,
                    fontSize: 36,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    maxWidth: 700,
                    margin: "0 auto",
                  }}
                >
                  Connect your inbox. Build your sequence. Start closing.
                </h1>
                <p style={{ color: theme.muted, fontSize: 16, marginTop: 20 }}>
                  MailThur sends cold emails from your own Gmail account.
                </p>
                <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
                  <PurpleButton label="Start Free Trial" width={180} highlight />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 48 }}>
              <h2 style={{ color: theme.white, fontSize: 28 }}>Dashboard</h2>
              <p style={{ color: theme.muted, marginTop: 8 }}>
                Welcome to MailThur — connect your first inbox to get started.
              </p>
            </div>
          )}
          <AnimatedCursor x={cursorX} y={cursorY} clicking={clicking} />
        </BrowserMockup>
      </div>
    </AbsoluteFill>
  );
}

export function Scene2Landing({ durationInFrames }: { durationInFrames: number }) {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={TITLE_FRAMES}>
        <TitleCard title="User Arrives at mailthur.com" />
      </Sequence>
      <Sequence from={TITLE_FRAMES} durationInFrames={durationInFrames - TITLE_FRAMES}>
        <LandingContent />
      </Sequence>
    </AbsoluteFill>
  );
}
