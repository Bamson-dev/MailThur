export const theme = {
  bg: "#0D0F1A",
  purple: "#7C3AED",
  white: "#FFFFFF",
  muted: "#6B7280",
  card: "#131625",
  border: "#1E2235",
  success: "#10B981",
  info: "#3B82F6",
  danger: "#EF4444",
  body: "#CBD5E1",
} as const;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TITLE_FRAMES = 30;
export const TRANSITION_FRAMES = 15;

export const SCENE_DURATIONS = {
  scene1: 8,
  scene2: 12,
  scene3: 15,
  scene4: 20,
  scene5: 10,
  scene6: 25,
  scene7: 20,
  scene8: 10,
} as const;

export const sceneFrames = (seconds: number) =>
  TITLE_FRAMES + seconds * FPS;

export const totalDurationFrames =
  sceneFrames(SCENE_DURATIONS.scene1) +
  sceneFrames(SCENE_DURATIONS.scene2) +
  sceneFrames(SCENE_DURATIONS.scene3) +
  sceneFrames(SCENE_DURATIONS.scene4) +
  sceneFrames(SCENE_DURATIONS.scene5) +
  sceneFrames(SCENE_DURATIONS.scene6) +
  sceneFrames(SCENE_DURATIONS.scene7) +
  sceneFrames(SCENE_DURATIONS.scene8) -
  TRANSITION_FRAMES * 7;
