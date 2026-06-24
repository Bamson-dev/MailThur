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
  SidebarMock,
} from "../components/BrowserMockup";
import { NarrationBar, TitleCard, useFadeInOut } from "../components/shared";
import { TITLE_FRAMES, theme } from "../theme";
import { fontFamily } from "../fonts";

function CampaignSending() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = 25 * 30;
  const narrationOpacity = useFadeInOut(20, 15, duration);

  const phase =
    frame < 80 ? "list" : frame < 200 ? "builder" : frame < 420 ? "launch" : "sent";

  const cursorX = interpolate(
    frame,
    [20, 60, 90, 220, 250, 380, 410],
    [920, 280, 280, 780, 780, 820, 820],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const cursorY = interpolate(
    frame,
    [20, 60, 90, 220, 250, 380, 410],
    [300, 180, 180, 520, 520, 470, 470],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const clicking =
    (frame >= 90 && frame < 105) ||
    (frame >= 250 && frame < 265) ||
    (frame >= 410 && frame < 425);

  const progress = spring({
    frame: frame - 430,
    fps,
    config: { damping: 200, stiffness: 80 },
  });

  const typedChars = Math.min(
    "Q3 Outreach Campaign".length,
    Math.floor(interpolate(frame, [100, 160], [0, 20], { extrapolateRight: "clamp" }))
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <BrowserMockup url="www.mailthur.com/dashboard/campaigns">
        <div style={{ display: "flex", height: "100%" }}>
          <SidebarMock />
          <div style={{ flex: 1, padding: 24, fontSize: 13, color: theme.body }}>
            {phase === "list" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ color: theme.white, fontSize: 22, margin: 0 }}>Campaigns</h2>
                  <PurpleButton label="New Campaign" width={150} highlight />
                </div>
              </>
            )}
            {(phase === "builder" || phase === "launch") && (
              <div>
                <h2 style={{ color: theme.white, fontSize: 20, margin: 0 }}>New Campaign</h2>
                <label style={{ color: theme.muted, display: "block", marginTop: 20 }}>
                  Campaign name
                </label>
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.card,
                    color: theme.white,
                  }}
                >
                  {"Q3 Outreach Campaign".slice(0, typedChars)}
                  <span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
                </div>
                <div style={{ marginTop: 20, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16, backgroundColor: theme.card }}>
                  <p style={{ color: theme.muted, margin: 0 }}>Step 1</p>
                  <p style={{ color: theme.white, fontWeight: 600, marginTop: 8 }}>
                    Quick question about your business
                  </p>
                  <p style={{ color: theme.body, marginTop: 12, lineHeight: 1.5 }}>
                    Hi {"{{first_name}}"}, I came across {"{{business_name}}"} while researching
                    businesses in {"{{city}}"}…
                  </p>
                </div>
                {phase === "launch" && (
                  <>
                    <div style={{ marginTop: 16, border: `1px dashed ${theme.border}`, borderRadius: 8, padding: 12, color: theme.muted }}>
                      CSV imported · 3 contacts
                    </div>
                    <div style={{ marginTop: 20 }}>
                      <PurpleButton label="Launch Campaign" width={180} highlight />
                    </div>
                  </>
                )}
              </div>
            )}
            {phase === "sent" && (
              <div>
                <h2 style={{ color: theme.white, fontSize: 20 }}>Q3 Outreach Campaign</h2>
                <div style={{ marginTop: 16, padding: 12, borderRadius: 8, backgroundColor: theme.card, border: `1px solid ${theme.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ color: theme.muted }}>Queue processing</span>
                    <span style={{ color: theme.white }}>{Math.round(progress * 100)}%</span>
                  </div>
                  <div style={{ height: 8, backgroundColor: theme.border, borderRadius: 999 }}>
                    <div style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: theme.purple, borderRadius: 999 }} />
                  </div>
                </div>
                <table style={{ width: "100%", marginTop: 20, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ color: theme.muted, textAlign: "left" }}>
                      <th style={{ padding: 8 }}>Contact</th>
                      <th style={{ padding: 8 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderTop: `1px solid ${theme.border}` }}>
                      <td style={{ padding: 8, color: theme.white }}>alex@company.com</td>
                      <td style={{ padding: 8 }}>
                        <span style={{ color: theme.success, backgroundColor: "rgba(16,185,129,0.15)", padding: "4px 8px", borderRadius: 6 }}>
                          Sent
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <AnimatedCursor x={cursorX} y={cursorY} clicking={clicking} visible={phase !== "sent"} />
          </div>
        </div>
      </BrowserMockup>
      <NarrationBar
        opacity={narrationOpacity}
        text="MailThur uses gmail.send to send outreach emails from the user's connected Gmail account. Emails appear as sent from the user's own address, not from MailThur servers."
      />
    </AbsoluteFill>
  );
}

export function Scene6CampaignSending({ durationInFrames }: { durationInFrames: number }) {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={TITLE_FRAMES}>
        <TitleCard title="Creating a Campaign and Sending Emails" />
      </Sequence>
      <Sequence from={TITLE_FRAMES} durationInFrames={durationInFrames - TITLE_FRAMES}>
        <CampaignSending />
      </Sequence>
    </AbsoluteFill>
  );
}
