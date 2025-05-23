import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";


export default defineConfig({
    plugins: [react(), basicSsl()],
    build: {
        outDir: "docs",
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    },
    base: "/Mon/",
    server: {
        https: true,
    }
});

