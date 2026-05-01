import { defineConfig, loadEnv } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env variables so we can read VITE_LLM_BASE_URL for the proxy target
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const llmBaseUrl = env.VITE_LLM_BASE_URL || "https://api.openai.com/v1";

  // Use only the origin (scheme + host) as the proxy target.
  // The path from the request is appended automatically by http-proxy;
  // our rewrite strips the /api/llm prefix so the final forwarded path is correct.
  let proxyTarget: string;
  try {
    proxyTarget = new URL(llmBaseUrl).origin;
  } catch {
    proxyTarget = "https://api.openai.com";
  }

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api/llm": {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/llm/, ""),
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.error("[Vite Proxy Error]", err);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log("[Vite Proxy]", req.method, req.url, "->", proxyReq.path);
            });
          },
        },
      },
    },
    plugins: [dyadComponentTagger(), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
