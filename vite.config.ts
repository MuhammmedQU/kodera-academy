import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Dev-only Vite middleware that executes the exact same `/api/*` route handlers
 * used by Vercel Serverless Functions, enabling local development & Playwright E2E
 * tests without requiring `vercel login`. Never bundled into production.
 */
function koderaDevApiPlugin(): Plugin {
  return {
    name: 'kodera-dev-api-middleware',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }
        try {
          const mod = await server.ssrLoadModule('/server/dev/viteApiMiddleware.ts');
          await mod.handleDevApiRequest(req, res);
        } catch (err) {
          console.error('[kodera-dev-api] Error handling request:', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(
              JSON.stringify({
                error: {
                  code: 'INTERNAL_SERVER_ERROR',
                  message: 'Lokal API serverində xəta baş verdi.',
                },
              }),
            );
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), koderaDevApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@server': path.resolve(__dirname, './server'),
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'INVALID_ANNOTATION' && warning.id?.includes('node_modules')) {
          return;
        }
        warn(warning);
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-prism': ['prism-react-renderer'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
