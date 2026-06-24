import { AbsoluteFill, Sequence } from "remotion";
import { Scene1Introduction } from "./scenes/Scene1Introduction";
import { Scene2Landing } from "./scenes/Scene2Landing";
import { Scene3DashboardConnect } from "./scenes/Scene3DashboardConnect";
import { Scene4OAuthConsent } from "./scenes/Scene4OAuthConsent";
import { Scene5InboxConnected } from "./scenes/Scene5InboxConnected";
import { Scene6CampaignSending } from "./scenes/Scene6CampaignSending";
import { Scene7ReplyDetection } from "./scenes/Scene7ReplyDetection";
import { Scene8Closing } from "./scenes/Scene8Closing";
import {
  FPS,
  HEIGHT,
  SCENE_DURATIONS,
  TRANSITION_FRAMES,
  WIDTH,
  sceneFrames,
  totalDurationFrames,
} from "./theme";

const scenes = [
  { Component: Scene1Introduction, duration: sceneFrames(SCENE_DURATIONS.scene1) },
  { Component: Scene2Landing, duration: sceneFrames(SCENE_DURATIONS.scene2) },
  { Component: Scene3DashboardConnect, duration: sceneFrames(SCENE_DURATIONS.scene3) },
  { Component: Scene4OAuthConsent, duration: sceneFrames(SCENE_DURATIONS.scene4) },
  { Component: Scene5InboxConnected, duration: sceneFrames(SCENE_DURATIONS.scene5) },
  { Component: Scene6CampaignSending, duration: sceneFrames(SCENE_DURATIONS.scene6) },
  { Component: Scene7ReplyDetection, duration: sceneFrames(SCENE_DURATIONS.scene7) },
  { Component: Scene8Closing, duration: sceneFrames(SCENE_DURATIONS.scene8) },
];

export const MailThurDemo: React.FC = () => {
  let offset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0D0F1A" }}>
      {scenes.map(({ Component, duration }, index) => {
        const from = offset;
        offset += duration - (index < scenes.length - 1 ? TRANSITION_FRAMES : 0);

        return (
          <Sequence key={index} from={from} durationInFrames={duration} premountFor={TRANSITION_FRAMES}>
            <Component durationInFrames={duration} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const mailthurDemoConfig = {
  id: "MailThurDemo",
  component: MailThurDemo,
  durationInFrames: totalDurationFrames,
  fps: FPS,
  width: WIDTH,
  height: HEIGHT,
};
