import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.studytracker.app",
  appName: "StudyTracker",
  webDir: "dist",
  ios: {
    contentInset: "automatic",
    backgroundColor: "#faf8f4",
  },
};

export default config;
