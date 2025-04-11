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
                manualChunks: undefined,
                assetFileNames: (assetInfo) => {
                    if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
                        return 'assets/images/[name]-[hash][extname]';
                    }
                    if (/\.css$/i.test(assetInfo.name)) {
                        return 'assets/css/[name]-[hash][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                }
            }
        }
    },
    base: "/Mon/",
    server: {
        https: true,
        host: true,
        port: 3000,
    },
    css: {
        devSourcemap: true,
        modules: {
            localsConvention: 'camelCase'
        }
    },
    optimizeDeps: {
        include: ['react', 'react-dom']
    }
});

