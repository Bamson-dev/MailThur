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

const TAGLINE =
  "Professional Cold Email Outreach from Your Own Inbox".split(" ");

function IntroContent() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 90 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        fontFamily,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Particles />
      <div
        style={{
          transform: `scale(${interpolate(logoScale, [0, 1], [0.85, 1])})`,
          opacity: logoScale,
        }}
      >
        <MailThurLogo size={72} />
      </div>
      <div
        style={{
          marginTop: 36,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 10px",
          maxWidth: 900,
        }}
      >
        {TAGLINE.map((word, i) => {
          const wordProgress = spring({
            frame: frame - 20 - i * 4,
            fps,
            config: { damping: 200, stiffness: 120 },
          });
          return (
            <span
              key={i}
              style={{
                color: theme.white,
                fontSize: 34,
                fontWeight: 500,
                opacity: wordProgress,
                transform: `translateY(${(1 - wordProgress) * 16}px)`,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
      <p
        style={{
          position: "absolute",
          bottom: 120,
          color: theme.purple,
          fontSize: 18,
          opacity: interpolate(frame, [70, 95], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Demonstrating Gmail API usage for Google OAuth verification
      </p>
    </AbsoluteFill>
  );
}

export function Scene1Introduction({ durationInFrames }: { durationInFrames: number }) {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={TITLE_FRAMES}>
        <TitleCard title="Introduction" />
      </Sequence>
      <Sequence from={TITLE_FRAMES} durationInFrames={durationInFrames - TITLE_FRAMES}>
        <IntroContent />
      </Sequence>
    </AbsoluteFill>
  );
}
