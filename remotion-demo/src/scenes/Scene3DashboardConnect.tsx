import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
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

function DashboardConnect() {
  const frame = useCurrentFrame();
  const duration = 15 * 30;
  const narrationOpacity = useFadeInOut(20, 15, duration);

  const cursorX = interpolate(frame, [120, 200, 220], [980, 620, 620], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorY = interpolate(frame, [120, 200, 220], [520, 360, 360], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const clicking = frame >= 220 && frame < 235;
  const showOAuth = frame >= 260;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <BrowserMockup url={showOAuth ? "accounts.google.com" : "www.mailthur.com/dashboard"}>
        {!showOAuth ? (
          <div style={{ display: "flex", height: "100%" }}>
            <SidebarMock />
            <div style={{ flex: 1, padding: 32 }}>
              <h2 style={{ color: theme.white, fontSize: 24, margin: 0 }}>
                Connect your inbox
              </h2>
              <p style={{ color: theme.muted, fontSize: 14, marginTop: 8 }}>
                Send outreach from your own Gmail account.
              </p>
              <div style={{ marginTop: 40 }}>
                <PurpleButton label="Connect Gmail Inbox" width={240} highlight />
              </div>
            </div>
            <AnimatedCursor x={cursorX} y={cursorY} clicking={clicking} />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              backgroundColor: "#F8FAFC",
              color: "#111827",
            }}
          >
            <div
              style={{
                width: 420,
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 32,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              }}
            >
              <p style={{ fontSize: 14, color: "#5F6368" }}>Sign in with Google</p>
              <h3 style={{ fontSize: 22, marginTop: 8 }}>
                MailThur wants access to your Google Account
              </h3>
            </div>
          </div>
        )}
      </BrowserMockup>
      <NarrationBar
        opacity={narrationOpacity}
        text="Users connect their own Gmail account using Google's secure OAuth flow. MailThur never asks for or stores your Gmail password."
      />
    </AbsoluteFill>
  );
}

export function Scene3DashboardConnect({
  durationInFrames,
}: {
  durationInFrames: number;
}) {
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={TITLE_FRAMES}>
        <TitleCard title="Dashboard and Connect Gmail" />
      </Sequence>
      <Sequence from={TITLE_FRAMES} durationInFrames={durationInFrames - TITLE_FRAMES}>
        <DashboardConnect />
      </Sequence>
    </AbsoluteFill>
  );
}
