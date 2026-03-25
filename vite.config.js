
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path";

// The target URL for the backend server
// We use localhost because both Vite and the Node server are running inside the same environment.
const backendTarget = 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true, 
        secure: false,     
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxy Request Sent:', req.method, req.url, '->', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy Response Received:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
    host: '0.0.0.0',
    port: 8081,
  },
});
