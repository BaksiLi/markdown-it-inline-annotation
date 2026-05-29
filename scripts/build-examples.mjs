import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Render every example through the real markdown-it pipeline so the
// before/after page can never drift from actual parser output.
const require = createRequire(import.meta.url);
const MarkdownIt = require("markdown-it");
const { inlineAnnotationPlugin } = require("../dist/index.js");

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const md = new MarkdownIt().use(inlineAnnotationPlugin);

const examples = [
  "[漢字]^^(かんじ) and cat^_(/kæt/)",
  "[李太白]^^(Lǐ Tài Bái|ㄌㄧˇ ㄊㄞˋ ㄅㄞˊ)",
  "[重要語句]^^(じゅうようごく|.-) and [強調]^^(..)^_(.~)",
  "[[護]^^(まも)れ]^_(プロテゴ)",
];

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const css = readFileSync(resolve(root, "styles/inline-annotation.css"), "utf8");

const sections = examples
  .map((source) => {
    const rendered = md.render(source);
    return `      <section>
        <div>
          <h2>Markdown</h2>
          <pre><code>${escapeHtml(source)}</code></pre>
        </div>
        <div>
          <h2>Rendered</h2>
          <div class="rendered">${rendered.trim()}</div>
        </div>
      </section>`;
  })
  .join("\n\n");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Inline Annotation Before / After</title>
    <style>
      :root { color-scheme: light; --bg: #f7f7f4; --panel: #fff; --ink: #25231f; --muted: #6f6a61; --line: #ded9ce; --accent: #276b67; }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--bg); color: var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.55; }
      main { width: min(980px, calc(100% - 32px)); margin: 0 auto; padding: 40px 0 56px; }
      header { margin-bottom: 28px; }
      h1 { margin: 0 0 8px; font-size: clamp(2rem, 6vw, 4rem); line-height: 0.95; }
      p { margin: 0; color: var(--muted); }
      section { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line); }
      h2 { margin: 0 0 12px; color: var(--accent); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
      pre, .rendered { min-height: 92px; margin: 0; padding: 18px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }
      pre { overflow-x: auto; white-space: pre-wrap; color: #38342e; font: 0.95rem/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .rendered { display: flex; align-items: center; font-size: 1.6rem; }
      .rendered p { color: var(--ink); margin: 0; }

      /* Canonical Inline Annotation stylesheet (generated from styles/inline-annotation.css). */
${css.replace(/^/gm, "      ")}
      @media (max-width: 760px) {
        main { width: min(100% - 24px, 980px); padding-top: 28px; }
        section { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Inline Annotation</h1>
        <p>Rendered live by markdown-it-inline-annotation. Do not edit by hand — run \`npm run build:examples\`.</p>
      </header>

${sections}
    </main>
  </body>
</html>
`;

writeFileSync(resolve(root, "examples/before-after.html"), html);
console.log("examples/before-after.html generated from live parser output");
