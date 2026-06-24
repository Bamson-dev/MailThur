import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BrowserMockup, SidebarMock } from "../components/BrowserMockup";
import { NarrationBar, TitleCard, useFadeInOut } from "../components/shared";
import { TITLE_FRAMES, theme } from "../theme";
import { fontFamily } from "../fonts";

function InboxConnected() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = 10 * 30;
  const narrationOpacity = useFadeInOut(20, 15, duration);

  const bannerSlide = spring({
    frame: frame - 20,
    fps,
    config: { damping: 200, stiffness: 100 },
  });
  const cardIn = spring({
    frame: frame - 50,
    fps,
    config: { damping: 200, stiffness: 90 },
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
      <BrowserMockup url="www.mailthur.com/dashboard/inboxes">
        <div style={{ display: "flex", height: "100%" }}>
          <SidebarMock />
          <div style={{ flex: 1, padding: 24, position: "relative" }}>
            <div
              style={{
                transform: `translateY(${(1 - bannerSlide) * -40}px)`,
                opacity: bannerSlide,
                backgroundColor: "rgba(16,185,129,0.12)",
                border: `1px solid ${theme.success}`,
                borderRadius: 10,
                padding: "12px 16px",
                color: theme.success,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Inbox connected successfully
            </div>
            <div
              style={{
                marginTop: 24,
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.card,
                padding: 20,
                opacity: cardIn,
                transform: `translateY(${(1 - cardIn) * 20}px)`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <p style={{ color: theme.white, fontSize: 16, fontWeight: 600, margin: 0 }}>
                    demo@example.com
                  </p>
                  <p style={{ color: theme.muted, fontSize: 13, marginTop: 6 }}>Google</p>
                </div>
                <span
                  style={{
                    backgroundColor: "rgba(16,185,129,0.15)",
                    color: theme.success,
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    height: "fit-content",
                  }}
                >
                  Active
                </span>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: theme.muted }}>
                  <span>Daily sending capacity</span>
                  <span>0 / 20 today</span>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: theme.border,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "4%",
                      height: "100%",
                      backgroundColor: theme.purple,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </BrowserMockup>
      <NarrationBar
        opacity={narrationOpacity}
        text="The inbox is now connected. MailThur stores only the OAuth tokens needed to send and read emails. No email content is stored."
      />
    </AbsoluteFill>
  );
}

export function Scene5InboxConnected({ durationInFrames }: { durationInFrames: number }) {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={TITLE_FRAMES}>
        <TitleCard title="Inbox Connected Successfully" />
      </Sequence>
      <Sequence from={TITLE_FRAMES} durationInFrames={durationInFrames - TITLE_FRAMES}>
        <InboxConnected />
      </Sequence>
    </AbsoluteFill>
  );
}
