import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

const apiProxy: ProxyOptions = {
  target: 'http://127.0.0.1:8000',
  changeOrigin: true,
  timeout: 120000,
  proxyTimeout: 120000,
  configure(proxy) {
    proxy.on('error', (_err, _req, res) => {
      const socket = res as { headersSent?: boolean; writeHead?: Function; end?: Function };
      if (socket && !socket.headersSent && socket.writeHead && socket.end) {
        socket.writeHead(502, { 'Content-Type': 'application/json' });
        socket.end(JSON.stringify({ detail: 'Cannot reach FastAPI on port 8000' }));
      }
    });
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',
    strictPort: true,
    proxy: {
      '/api': apiProxy,
      '/health': apiProxy,
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': apiProxy,
      '/health': apiProxy,
    },
  },
});
