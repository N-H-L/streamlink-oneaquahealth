import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" so the static build works from any sub-path (e.g. GitHub Pages).
export default defineConfig({
  plugins: [react()],
  base: "./",
  test: { environment: "node", include: ["src/**/*.test.ts"] },
} as any);
