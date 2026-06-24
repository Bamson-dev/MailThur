import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AnimatedCursor, BrowserMockup } from "../components/BrowserMockup";
import { NarrationBar, TitleCard, useFadeInOut } from "../components/shared";
import { TITLE_FRAMES, theme } from "../theme";
import { fontFamily } from "../fonts";

function OAuthConsent() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = 20 * 30;
  const narrationOpacity = useFadeInOut(20, 15, duration);

  const bullet1 = spring({ frame: frame - 80, fps, config: { damping: 200, stiffness: 120 } });
  const bullet2 = spring({ frame: frame - 110, fps, config: { damping: 200, stiffness: 120 } });

  const cursorX = interpolate(frame, [380, 440, 460, 500], [700, 520, 680, 680], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorY = interpolate(frame, [380, 440, 460, 500], [520, 430, 560, 560], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const clicking = (frame >= 460 && frame < 475) || (frame >= 500 && frame < 515);
  const backToDashboard = frame >= 540;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <BrowserMockup
        url={backToDashboard ? "www.mailthur.com/dashboard/inboxes" : "accounts.google.com/o/oauth2"}
      >
        {!backToDashboard ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              backgroundColor: "#F1F3F4",
            }}
          >
            <div
              style={{
                width: 480,
                backgroundColor: "#fff",
                borderRadius: 8,
                border: "1px solid #DADCE0",
                padding: "36px 40px",
                color: "#202124",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: theme.purple,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  M
                </div>
                <span style={{ fontSize: 14, color: "#5F6368" }}>demo@example.com</span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>
                MailThur wants access to your Google Account
              </h2>
              <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
                <label style={{ display: "flex", gap: 12, fontSize: 15 }}>
                  <input type="checkbox" checked readOnly style={{ width: 18, height: 18 }} />
                  View your email messages and settings
                </label>
                <label style={{ display: "flex", gap: 12, fontSize: 15 }}>
                  <input type="checkbox" checked readOnly style={{ width: 18, height: 18 }} />
                  Send email on your behalf
                </label>
              </div>
              <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <div style={{ padding: "10px 24px", color: theme.purple, fontWeight: 500 }}>
                  Cancel
                </div>
                <div
                  style={{
                    padding: "10px 24px",
                    backgroundColor: theme.purple,
                    color: "#fff",
                    borderRadius: 4,
                    fontWeight: 500,
                  }}
                >
                  Continue
                </div>
              </div>
            </div>
            <AnimatedCursor x={cursorX} y={cursorY} clicking={clicking} />
          </div>
        ) : (
          <div style={{ padding: 48, color: theme.white }}>
            <h2 style={{ fontSize: 28 }}>Inboxes</h2>
            <p style={{ color: theme.muted }}>Redirecting back to MailThur…</p>
          </div>
        )}
      </BrowserMockup>
      <NarrationBar opacity={narrationOpacity}>
        <div style={{ textAlign: "center", color: theme.white, fontSize: 18, lineHeight: 1.5 }}>
          <p style={{ margin: "0 0 8px" }}>MailThur requests two Gmail permissions:</p>
          <p style={{ margin: "4px 0", opacity: bullet1 }}>
            gmail.send: To send outreach emails from your inbox on your behalf
          </p>
          <p style={{ margin: "4px 0", opacity: bullet2 }}>
            gmail.readonly: To detect replies to emails we sent by checking Gmail threads
          </p>
        </div>
      </NarrationBar>
    </AbsoluteFill>
  );
}

export function Scene4OAuthConsent({ durationInFrames }: { durationInFrames: number }) {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={TITLE_FRAMES}>
        <TitleCard title="Google OAuth Consent Screen" />
      </Sequence>
      <Sequence from={TITLE_FRAMES} durationInFrames={durationInFrames - TITLE_FRAMES}>
        <OAuthConsent />
      </Sequence>
    </AbsoluteFill>
  );
}
