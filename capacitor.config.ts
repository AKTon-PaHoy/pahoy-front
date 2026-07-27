import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
    appId: "com.pahoy.app",
    appName: "Pa·Hoy",
    webDir: "dist",
    server: {
        androidScheme: "https",
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            launchFadeOutDuration: 300,
            backgroundColor: "#FFFFFF",
            androidSplashResourceName: "splash",
            androidScaleType: "CENTER_INSIDE",
            showSpinner: false,
            splashFullScreen: false,
            splashImmersive: false,
        },
    },
};

export default config;
