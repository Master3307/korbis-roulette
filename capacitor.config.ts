import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.korbi.roulettelogging',
  appName: "Korbi's Roulette Logging",
  webDir: 'dist',
  backgroundColor: '#0b3d24',
  android: {
    allowMixedContent: false,
  },
};

export default config;
