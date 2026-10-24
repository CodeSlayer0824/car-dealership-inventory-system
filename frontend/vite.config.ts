import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: "..",
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
