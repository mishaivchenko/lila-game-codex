import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const localStaticDirs = [
  { prefix: '/cards/', dir: path.resolve(__dirname, '../cards') },
  { prefix: '/field/', dir: path.resolve(__dirname, '../field') },
] as const;

const localStaticPlugin = (): Plugin => ({
  name: 'lila-local-static-assets',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const requestUrl = req.url ?? '';
      if (requestUrl.startsWith('/api/events')) {
        res.statusCode = 204;
        res.end();
        return;
      }
      const match = localStaticDirs.find(({ prefix }) => requestUrl.startsWith(prefix));
      if (!match) {
        next();
        return;
      }

      const relativePath = decodeURIComponent(requestUrl.slice(match.prefix.length));
      const safeRelativePath = relativePath.split('?')[0].replace(/^\/+/, '');
      const absolutePath = path.resolve(match.dir, safeRelativePath);
      if (!absolutePath.startsWith(match.dir)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }

      if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
        next();
        return;
      }

      fs.createReadStream(absolutePath).pipe(res);
    });
  },
});

export default defineConfig({
  plugins: [react(), localStaticPlugin()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, '../node_modules/react'),
      'react/jsx-runtime': path.resolve(__dirname, '../node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(__dirname, '../node_modules/react/jsx-dev-runtime.js'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
    },
  },
  server: {
    port: 5173,
    allowedHosts: ['.trycloudflare.com', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
