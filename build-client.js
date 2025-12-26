import { build } from "esbuild";

// Bundle x402 client libraries for browser use
build({
  entryPoints: ["public/x402-client.js"],
  bundle: true,
  outfile: "public/x402-client-bundle.js",
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  external: ["fs", "path", "crypto", "stream", "util"], // Node.js modules not available in browser
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  banner: {
    js: "// x402 Client Bundle for Browser",
  },
})
  .then(() => {
    console.log("✅ x402 client bundle created successfully");
  })
  .catch((error) => {
    console.error("❌ Failed to build x402 client bundle:", error);
    process.exit(1);
  });
