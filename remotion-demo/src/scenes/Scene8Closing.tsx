import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MailThurLogo } from "../components/BrowserMockup";
import { Particles, TitleCard } from "../components/shared";
import { TITLE_FRAMES, theme } from "../theme";
import { fontFamily } from "../fonts";

const BULLETS = [
  "gmail.send is used exclusively to send emails the user has written and configured.",
  "gmail.readonly is used exclusively to detect replies in Gmail threads we initiated.",
  "No email content is stored, sold, or used for any other purpose.",
];

function ClosingContent() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const particleOpacity = interpolate(frame, [200, 280], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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
      <div style={{ opacity: particleOpacity }}>
        <Particles />
      </div>
      <MailThurLogo size={64} />
      <div style={{ marginTop: 48, maxWidth: 1100, padding: "0 40px" }}>
        {BULLETS.map((bullet, i) => {
          const progress = spring({
            frame: frame - 30 - i * 25,
            fps,
            config: { damping: 200, stiffness: 100 },
          });
          return (
            <p
              key={i}
              style={{
                color: theme.white,
                fontSize: 24,
                lineHeight: 1.5,
                margin: "0 0 20px",
                opacity: progress,
                transform: `translateX(${(1 - progress) * 30}px)`,
              }}
            >
              • {bullet}
            </p>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 100,
          opacity: interpolate(frame, [220, 260], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          textAlign: "center",
        }}
      >
        <MailThurLogo size={48} />
        <p style={{ color: theme.purple, fontSize: 28, marginTop: 16, fontWeight: 600 }}>
          mailthur.com
        </p>
      </div>
    </AbsoluteFill>
  );
}

export function Scene8Closing({ durationInFrames }: { durationInFrames: number }) {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={TITLE_FRAMES}>
        <TitleCard title="Summary and Closing" />
      </Sequence>
      <Sequence from={TITLE_FRAMES} durationInFrames={durationInFrames - TITLE_FRAMES}>
        <ClosingContent />
      </Sequence>
    </AbsoluteFill>
  );
}
