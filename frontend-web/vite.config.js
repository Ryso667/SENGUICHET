import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  plugins: [
    {
      name: "tabler-icons-proxy",
      resolveId(id) {
        if (id === "@tabler/icons-react") {
          return path.resolve(__dirname, "src/lib/tabler-icons.js");
        }
      },
    },
  ],
  server: {
    port: 3000,
    open: false,
  },
});
