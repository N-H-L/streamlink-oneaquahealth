import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" so the static build works from any sub-path (e.g. GitHub Pages).
export default defineConfig({
  plugins: [react()],
  base: "./",
  // The OneAquaHealth sandbox answers CORS preflights with two conflicting
  // Access-Control-Allow-Origin headers, so browsers refuse it from any other origin. Server-side
  // clients (our scripts) are unaffected. In dev we proxy it so the app can be driven against the
  // real server; the deployed build cannot, and the UI says so.
  server: {
    proxy: {
      "/oah-fhir": {
        target: "https://sandbox.hl7europe.eu",
        changeOrigin: true,
        rewrite: (p: string) => p.replace(/^\/oah-fhir/, "/oneaquahealth/fhir"),
      },
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },  // app tests use import.meta.glob, which vitest supports
} as any);
