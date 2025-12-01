import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.campusmarket.app',
  appName: 'CampusMarket',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  }
};

export default config;
