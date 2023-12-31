// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        // generate .vite/manifest.json in outDir
        manifest: true,
        rollupOptions: {
            // overwrite default .html entry
            input: './src/eventlet.js',
        },
    },
})