import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const backendDir = import.meta.dirname;
const frontendDir = path.resolve(backendDir, "..", "FrontEnd", "client");
const nodeModulesDir = path.resolve(backendDir, "node_modules");

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  // Use Backend's node_modules for module resolution
  cacheDir: path.resolve(nodeModulesDir, ".vite"),
  root: frontendDir,
  // Explicitly tell Vite where to find modules
  resolve: {
    alias: {
      "@": path.resolve(frontendDir, "src"),
      "@shared": path.resolve(backendDir, "shared"),
      "@assets": path.resolve(backendDir, "..", "FrontEnd", "attached_assets"),
    },
    preserveSymlinks: true,
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: path.resolve(backendDir, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
      },
    },
    fs: {
      strict: false,
      allow: [
        frontendDir,
        nodeModulesDir,
        backendDir,
        path.resolve(backendDir, ".."),
      ],
    },
  },
  optimizeDeps: {
    // Force Vite to look in Backend/node_modules
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      '@tanstack/react-query',
      '@hookform/resolvers/zod',
      'wouter',
      'zod',
      'lucide-react',
      'react-hook-form',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
    ],
  },
});
