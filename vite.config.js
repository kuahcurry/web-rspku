import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        react({
            include: '**/*.jsx',
        }),
        laravel({
            input: ['resources/js/main.jsx'],
            refresh: true,
        }),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react':     ['react', 'react-dom', 'react-router-dom'],
                    'vendor-icons':     ['react-icons'],
                    'vendor-recaptcha': ['react-google-recaptcha-v3'],
                },
            },
        },
    },
    server: {
        hmr: {
            host: 'localhost',
        },
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
            '/storage': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
});
