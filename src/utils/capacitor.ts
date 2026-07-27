import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { StatusBar, Style } from "@capacitor/status-bar";

export function isNative(): boolean {
    return Capacitor.isNativePlatform();
}

export async function initializeNativeApp(): Promise<void> {
    if (!isNative()) return;

    // Configure status bar: overlay mode for edge-to-edge rendering.
    // On Android 15+ this is enforced by the system, so we wrap in try/catch.
    try {
        await StatusBar.setOverlaysWebView({ overlay: true });
    } catch {
        // Already edge-to-edge on Android 15+
    }
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: "#00FFFFFF" });
}

export function setupDeepLinkListener(navigate: (path: string) => void): void {
    if (!isNative()) return;

    App.addListener("appUrlOpen", ({ url }) => {
        const parsedUrl = new URL(url);
        const path = parsedUrl.pathname;

        // Only navigate for supported deep link patterns
        if (
            path.startsWith("/gig/") ||
            path.startsWith("/contracts/") ||
            path.startsWith("/messages/")
        ) {
            navigate(path);
        }
    });
}

export async function openExternalUrl(url: string): Promise<void> {
    if (isNative()) {
        await Browser.open({ url });
    } else {
        window.open(url, "_blank");
    }
}
