import legacyCourseDataRedirects from "./config/legacy-course-data-redirects.json";
import type { NextConfig } from "next";

const development = process.env.NODE_ENV === "development";
// The portable offline edition is served over plain HTTP on a local network,
// where HTTPS upgrades and HSTS would stop other computers loading the page.
const offlineBuild = process.env.PAC_OFFLINE_BUILD === "1";
const agencyZone = process.env.NEXT_PUBLIC_DHS_AGENCY_ZONE === "1";
const agencyOrigin = process.env.NEXT_PUBLIC_DHS_AGENCY_ORIGIN || process.env.DHS_AGENCY_ORIGIN;
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${development ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(development || offlineBuild ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// Ask dictation and read-aloud need the microphone and in-memory audio. People usually reach Ask through the menu,
// which does not load a new document, so the page they started on must already allow both. The browser still asks
// the person before any microphone use, and only the Ask page requests it.
const askVoiceAllowed = process.env.PAC_CLONE_AGENTS === "on";
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy + "; media-src 'self' blob:" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: `camera=(), microphone=(${askVoiceAllowed ? "self" : ""}), geolocation=(), browsing-topics=()` },
  // Preserve same-origin form authentication; send no referrer to other sites.
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
  ...(development || offlineBuild
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const linuxCpuOnnxRuntime = [
  "./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/onnxruntime_binding.node",
  "./node_modules/onnxruntime-node/bin/napi-v6/linux/x64/libonnxruntime.so.1",
];

const hostedSemanticRuntimeIncludes = [
  "./models/bge-small-en-v1.5/**/*",
  "./node_modules/@huggingface/transformers/package.json",
  "./node_modules/@huggingface/transformers/dist/transformers.node.mjs",
  "./node_modules/onnxruntime-node/package.json",
  "./node_modules/onnxruntime-node/dist/**/*",
  ...linuxCpuOnnxRuntime,
  "./node_modules/onnxruntime-common/package.json",
  "./node_modules/onnxruntime-common/dist/esm/index.js",
  "./node_modules/onnxruntime-common/dist/cjs/index.js",
];

/**
 * Downloads share one function. Force-include only data/runtime files NFT
 * cannot see. Do not glob whole office trees — #47's
 * pdfkit/docx/exceljs/pptxgenjs/** includes blew the 80 MiB
 * verify-download-trace budget.
 *
 * pdfkit: AFM via a computed runtime path.
 * pptx: pptxgenjs is a serverExternalPackage whose CJS/ESM entry does
 * `require('jszip')` / `import JSZip from 'jszip'` at load time. #48's
 * import-trace of pptxgenjs/package.json + dist does not keep jszip (or
 * pako/lie/immediate/setimmediate) on the Vercel function, so only pptx
 * throws and the route returns x-download-fallback: html. Include the
 * jszip graph, not pptxgenjs/**.
 */
const downloadRuntimeIncludes = [
  "./node_modules/pdfkit/js/data/**/*",
  "./node_modules/pdfjs-dist/standard_fonts/LiberationSans-*.ttf",
  "./node_modules/pdfjs-dist/standard_fonts/LICENSE_LIBERATION",
  "./node_modules/jszip/**/*",
  "./node_modules/pako/**/*",
  "./node_modules/lie/**/*",
  "./node_modules/immediate/**/*",
  "./node_modules/setimmediate/**/*",
];

const nextConfig: NextConfig = {
  ...(agencyZone ? { assetPrefix: "/dsd-static" } : {}),
  async rewrites() { return agencyZone ? [{ source: "/dsd-api/ask", destination: "/api/ask" }] : []; },
  // Send the full page head before the status, so a missing page really answers 404.
  htmlLimitedBots: /.*/,
  // Each build worker holds its own database pool. Bound prerender concurrency
  // so builds and the running service fit the hosted session pooler's budget.
  experimental: { cpus: 2, webpackMemoryOptimizations: true,
    ...(agencyZone && agencyOrigin ? { serverActions: { allowedOrigins: [agencyOrigin, process.env.NEXT_PUBLIC_DSD_FRONT_DOOR_ORIGIN].filter((o): o is string => Boolean(o)).map(o => new URL(o).host) } } : {}),
  },
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  turbopack: { root: __dirname },
  poweredByHeader: false,
  // Keep original media intact; send a suitable image size for each screen.
  images: { qualities: [75, 90], ...(agencyZone ? { path: "/dsd-static/_next/image" } : {}) },
  serverExternalPackages: ["@huggingface/transformers", "onnxruntime-node", "docx", "exceljs", "pptxgenjs", "jszip", "pdfkit", "pdfjs-dist", "ffmpeg-static"],
  // Staff Ask (POST /api/ask) is browse-and-download only after the September 2026 lock.
  // It must not become the Hugging Face packaging target: the route no longer imports the
  // typed pipeline, so Next's NFT for it correctly omits @huggingface/transformers.
  // Owner evals still call askConcierge (and therefore local-semantic). Pin that Node
  // runtime onto consultant/cron functions. Include only the CPU ONNX natives — the
  // previous linux/x64/** glob also pulled libonnxruntime_providers_cuda.so (~220 MiB)
  // and blew the 245 MiB packaging budget.
  // Downloads: AFM data + jszip graph under /api/downloads/**. Keep
  // ASK/ONNX/models excluded. Per-format dynamic imports stay in the
  // route so one missing office file cannot take every binary format down.
  outputFileTracingIncludes: {
    "/source-reading/*": ["./data/source-readings/*.json"],
    "/api/consultant/toolkit/upload": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
    "/api/consultant/toolkit/export": [...downloadRuntimeIncludes, "./lib/consultant-toolkit/fonts/*.ttf"],
    "/api/consultant/analysis/upload": ["./node_modules/ffmpeg-static/ffmpeg*", "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
    "/api/consultant/**": hostedSemanticRuntimeIncludes,
    "/api/cron/orchestrate": hostedSemanticRuntimeIncludes,
    // Self-directed course downloads are built from the page's own course list and data files.
    "/api/downloads/**": [...downloadRuntimeIncludes, "./public/learning/self-directed/index.html", "./public/learning/self-directed/data/*.json"],
    "/api/equity-workspace/policy-analysis/export": downloadRuntimeIncludes,
    "/api/equity-workspace/policy-analysis/fetch-source": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
  outputFileTracingExcludes: {
    "/*": [
      "./public/videos/end-user-guide/**/*",
      "./node_modules/onnxruntime-node/bin/napi-v6/**/libonnxruntime_providers_cuda.so",
      "./node_modules/onnxruntime-node/bin/napi-v6/**/libonnxruntime_providers_tensorrt.so",
      "./node_modules/onnxruntime-node/bin/napi-v6/darwin/**/*",
      "./node_modules/onnxruntime-node/bin/napi-v6/win32/**/*",
      "./node_modules/@img/sharp-libvips-linuxmusl-x64/**/*",
      "./node_modules/@img/sharp-linuxmusl-x64/**/*",
      "./node_modules/@img/sharp-wasm32/**/*",
    ],
    "/api/downloads/**": [
      "./models/bge-small-en-v1.5/**/*",
      "./node_modules/onnxruntime-node/**/*",
      "./node_modules/onnxruntime-common/**/*",
      "./node_modules/@huggingface/transformers/**/*",
    ],
  },
  async redirects() {
    return [
      ...legacyCourseDataRedirects,
      { source: "/contribute", destination: "/support", permanent: false },
      { source: "/contribute/:path*", destination: "/support", permanent: false },
      { source: "/library/self-directed-:number", destination: "/learning/self-directed/index.html?course=:number", permanent: false },
      { source: "/resources/self-directed-:number", destination: "/learning/self-directed/index.html?course=:number", permanent: false },
      { source: "/courses/dc-l94-equity-and-ethics-in-ai-and-automation", destination: "/courses", permanent: false },
      { source: "/courses/dc-s99-responsible-use-of-ai-tools-at-work", destination: "/courses", permanent: false },
      { source: "/library/course-dc-l94-equity-and-ethics-in-ai-and-automation", destination: "/library", permanent: false },
      { source: "/library/course-dc-s99-responsible-use-of-ai-tools-at-work", destination: "/library", permanent: false },
      { source: "/learn/readings/reading-068", destination: "/learn/readings", permanent: false },
      { source: "/videos/end-user-guide/b4f21565e398/:file", destination: "/videos/end-user-guide/7387783c7870/:file", permanent: false },
      { source: "/blueprint", destination: "/about", permanent: true },
      // The guide index never existed; guides live under /practice-guides/:slug and are listed on Practice.
      { source: "/practice-guides", destination: "/practice", permanent: false },
      // Orientation is now the "New to DSD" section of Start.
      { source: "/orientation", destination: "/start#new-to-dsd", permanent: false },
      // The logic-model "Inputs" step was renamed so it no longer competes with the Program charter.
      { source: "/program/foundation", destination: "/program/what-informs", permanent: false },
      // Retired Oct 2026 on the program lead's decision: Toolkit Studio and Learning Lab.
      { source: "/toolkit-studio", destination: "/learn/equity-toolkit", permanent: false },
      { source: "/toolkit-studio/:path*", destination: "/learn/equity-toolkit", permanent: false },
      { source: "/one-dsd/team/learning-lab", destination: "/one-dsd/team", permanent: false },
      { source: "/communities", destination: "/minnesota-communities", permanent: true },
      { source: "/communities/from-the-list", destination: "/minnesota-communities", permanent: true },
      { source: "/professional-support", destination: "/support", permanent: true },
      { source: "/library/course-:id", destination: "/courses/:id", permanent: true },
      { source: "/c/:id/:lesson", destination: "/courses/:id/:lesson", permanent: true },
      { source: "/c/:id", destination: "/courses/:id", permanent: true },
      { source: "/ci/:id", destination: "/courses/cultural-intelligence-:id", permanent: true },
      { source: "/guided-start", destination: "/start", permanent: true },
      { source: "/resources", destination: "/library", permanent: true },
      { source: "/resources/:path*", destination: "/library/:path*", permanent: true },
      { source: "/paths", destination: "/learn/paths", permanent: true },
      // Guided pathways and reading paths now share one list under Learn.
      { source: "/journeys", destination: "/learn/paths", permanent: false },
      // The six learning stages were retired for the four levels.
      { source: "/learn/orientation", destination: "/start#new-to-dsd", permanent: false },
      { source: "/learn/foundations", destination: "/learn/paths#level-foundations", permanent: false },
      { source: "/learn/intercultural-practice", destination: "/learn/paths#level-applying", permanent: false },
      { source: "/learn/application", destination: "/learn/paths#level-applying", permanent: false },
      { source: "/learn/systems-practice", destination: "/learn/paths#level-leading", permanent: false },
      { source: "/learn/leadership-continuity", destination: "/learn/paths#level-leading", permanent: false },
      { source: "/journeys/:journeyId", destination: "/learn/paths/:journeyId", permanent: false },
      { source: "/paths/:id", destination: "/practice/:id", permanent: true },
      { source: "/my-view", destination: "/my-work", permanent: true },

      // The original owner workspace occupied /practice. Keep precise compatibility
      // routes while reserving /practice for private, staff-facing application work.
      { source: "/practice/audit", destination: "/consultant/audit", permanent: false },
      { source: "/practice/evals", destination: "/consultant/evals", permanent: false },
      { source: "/practice/orchestrator", destination: "/consultant/orchestrator", permanent: false },
      { source: "/practice/queue/:path*", destination: "/consultant/queue/:path*", permanent: false },
      { source: "/practice/registry", destination: "/consultant/registry", permanent: false },
      { source: "/practice/research", destination: "/consultant/research", permanent: false },
      { source: "/practice/resources", destination: "/consultant/resources", permanent: false },
      { source: "/practice/resources/:path*", destination: "/consultant/resources/:path*", permanent: false },
      { source: "/practice/review", destination: "/consultant/review", permanent: false },
      { source: "/one-dsd-team", destination: "/consultant/one-dsd-team", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      ...(process.env.PAC_CLONE_AGENTS === "on" ? [{ source: "/ask/:path*", headers: [
        { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), browsing-topics=()" },
        { key: "Content-Security-Policy", value: contentSecurityPolicy + "; media-src 'self' blob:" },
      ] }] : []),
      // Video URLs include the media hash, so reviewed copies can be cached safely.
      { source: "/videos/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/videos/equity-outcome-map/:version/video-4k.mp4", headers: [{ key: "Content-Disposition", value: 'attachment; filename="Equity-Outcome-Map-4K.mp4"' }] },
      { source: "/videos/equity-in-practice/:version/video-4k.mp4", headers: [{ key: "Content-Disposition", value: 'attachment; filename="People-Access-Culture-in-Practice-DSD-Example-4K.mp4"' }] },
      { source: "/videos/equity-toolkit-worked-example/:version/video-4k.mp4", headers: [{ key: "Content-Disposition", value: 'attachment; filename="Equity-Analysis-Toolkit-Worked-Example-4K.mp4"' }] },
      { source: "/learning/self-directed/data/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/embedded-tools/:path*", headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors 'self'") + "; media-src 'self' blob:" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ] },
      // Only these public workspaces may appear inside this app's own pages.
      ...[
        "/library/equity-review-tools/DSD_Equity_Policy_Analysis_Tool.html",
        "/library/equity-review-tools/DSD_HCBS_Equity_Policy_Analysis_Tool.html",
        "/library/one-dsd-planning/One_DSD_Quarterly_Report_Dashboard.html",
      ].map(source => ({ source, headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors 'self'") },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ] })),
    ];
  },
};

export default nextConfig;
