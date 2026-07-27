import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    base: "./",
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: "autoUpdate",
            devOptions: { enabled: false },
            workbox: {
                globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
                runtimeCaching: [
                    {
                        urlPattern: /\/api\/.*/,
                        handler: "NetworkFirst",
                        method: "GET",
                        options: {
                            cacheName: "api-cache",
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 300,
                            },
                            networkTimeoutSeconds: 3,
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                ],
            },
            manifest: {
                name: "Pa·Hoy",
                short_name: "PaHoy",
                description: "Conecta con talento local en tu comunidad",
                theme_color: "#E8590C",
                background_color: "#FFFFFF",
                display: "standalone",
                start_url: "/",
                icons: [
                    {
                        src: "/icons/icon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/icons/icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
