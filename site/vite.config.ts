import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    allowedHosts: [".unii.dev", "unii.dev"],
  },
  define: {
    "import.meta.env.API_URL": JSON.stringify(
      process.env.API_URL ?? "https://api.unii.dev",
    ),
  },
});
