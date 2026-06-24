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

function ReplyDetection() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = 20 * 30;
  const narrationOpacity = useFadeInOut(20, 15, duration);

  const badgeIn = spring({ frame: frame - 30, fps, config: { damping: 200, stiffness: 100 } });
  const statusChange = frame >= 120;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <BrowserMockup url="www.mailthur.com/dashboard/campaigns/q3-outreach">
        <div style={{ display: "flex", height: "100%" }}>
          <SidebarMock />
          <div style={{ flex: 1, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ color: theme.white, fontSize: 22, margin: 0 }}>
                Q3 Outreach Campaign
              </h2>
              <div
                style={{
                  opacity: badgeIn,
                  transform: `scale(${interpolate(badgeIn, [0, 1], [0.8, 1])})`,
                  backgroundColor: "rgba(59,130,246,0.15)",
                  border: `1px solid ${theme.info}`,
                  color: theme.info,
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                1 new reply detected
              </div>
            </div>
            <table style={{ width: "100%", marginTop: 28, borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ color: theme.muted, textAlign: "left" }}>
                  <th style={{ padding: 10 }}>Contact</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10 }}>Sequence</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderTop: `1px solid ${theme.border}` }}>
                  <td style={{ padding: 10, color: theme.white }}>alex@company.com</td>
                  <td style={{ padding: 10 }}>
                    <span
                      style={{
                        color: statusChange ? theme.info : theme.muted,
                        backgroundColor: statusChange
                          ? "rgba(59,130,246,0.15)"
                          : "rgba(107,114,128,0.15)",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      {statusChange ? "Replied" : "In Progress"}
                    </span>
                  </td>
                  <td style={{ padding: 10, color: statusChange ? theme.danger : theme.muted }}>
                    {statusChange ? "Stopped — reply detected" : "Step 1 active"}
                  </td>
                </tr>
                <tr style={{ borderTop: `1px solid ${theme.border}` }}>
                  <td style={{ padding: 10, color: theme.white }}>sam@startup.io</td>
                  <td style={{ padding: 10, color: theme.muted }}>In Progress</td>
                  <td style={{ padding: 10, color: theme.muted }}>Step 1 scheduled</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </BrowserMockup>
      <NarrationBar
        opacity={narrationOpacity}
        text="MailThur uses gmail.readonly to check Gmail threads for replies to emails we sent. When a reply is detected, the sequence stops automatically so the user can respond personally. We only read thread activity in conversations we initiated. We never read unrelated emails."
      />
    </AbsoluteFill>
  );
}

export function Scene7ReplyDetection({ durationInFrames }: { durationInFrames: number }) {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={TITLE_FRAMES}>
        <TitleCard title="Reply Detection" />
      </Sequence>
      <Sequence from={TITLE_FRAMES} durationInFrames={durationInFrames - TITLE_FRAMES}>
        <ReplyDetection />
      </Sequence>
    </AbsoluteFill>
  );
}
