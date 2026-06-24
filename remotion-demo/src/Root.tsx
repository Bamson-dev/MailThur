import { Composition } from "remotion";
import { MailThurDemo, mailthurDemoConfig } from "./MailThurDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={mailthurDemoConfig.id}
        component={mailthurDemoConfig.component}
        durationInFrames={mailthurDemoConfig.durationInFrames}
        fps={mailthurDemoConfig.fps}
        width={mailthurDemoConfig.width}
        height={mailthurDemoConfig.height}
      />
    </>
  );
};
