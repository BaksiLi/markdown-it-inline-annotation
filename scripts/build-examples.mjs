import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Render every example through the real markdown-it pipeline so the
// before/after page can never drift from actual parser output.
const require = createRequire(import.meta.url);
const MarkdownIt = require("markdown-it");
const { inlineAnnotationPlugin } = require("../dist/index.js");
const fixtureCorpus = require("../fixtures/html-render.json");

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

function scriptJson(value) {
  return JSON.stringify(value, null, 8)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

const css = readFileSync(resolve(root, "styles/inline-annotation.css"), "utf8");

const generatedNote = "Do not edit by hand. Run `npm run build:examples`.";

const beforeAfterSections = examples
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

const beforeAfterHtml = `<!doctype html>
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
${css.replace(/^(?=.)/gm, "      ")}
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
        <p>Rendered by markdown-it-inline-annotation. ${generatedNote}</p>
      </header>

${beforeAfterSections}
    </main>
  </body>
</html>
`;

const fixtureExamples = fixtureCorpus.cases.map(({ id, category, name, input }) => ({
  id,
  category,
  name,
  input,
}));

const defaultSource = `[漢字]^^(かんじ) and cat^_(/kæt/)
[李太白]^^(Lǐ Tài Bái|ㄌㄧˇ ㄊㄞˋ ㄅㄞˊ)
[重要語句]^^(じゅうようごく|.-)`;

const playgroundHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Inline Annotation Playground</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f7f8;
        --panel: #ffffff;
        --ink: #202326;
        --muted: #667076;
        --line: #d7dde1;
        --field: #fbfcfd;
        --accent: #17736b;
        --accent-ink: #ffffff;
        --code: #172026;
        --mark: #f1b24a;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        line-height: 1.5;
      }

      main {
        width: min(1180px, calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0 36px;
      }

      header {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--line);
      }

      h1 {
        margin: 0;
        font-size: clamp(1.8rem, 4vw, 3.2rem);
        line-height: 1;
        letter-spacing: 0;
      }

      .meta {
        margin: 8px 0 0;
        color: var(--muted);
        font-size: 0.92rem;
      }

      .toolbar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 10px;
      }

      label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
      }

      select,
      textarea,
      output {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--field);
        color: var(--ink);
        font: inherit;
      }

      select {
        min-width: min(360px, 100%);
        height: 38px;
        padding: 0 36px 0 10px;
      }

      .toggle {
        display: inline-flex;
        grid-template-columns: none;
        align-items: center;
        gap: 8px;
        height: 38px;
        padding: 0 10px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        color: var(--ink);
        text-transform: none;
        font-size: 0.9rem;
        font-weight: 600;
      }

      .toggle input { margin: 0; accent-color: var(--accent); }

      .workspace {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 16px;
        margin-top: 16px;
      }

      .panel {
        min-width: 0;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
      }

      .panel h2 {
        margin: 0;
        padding: 10px 12px;
        border-bottom: 1px solid var(--line);
        color: var(--accent);
        font-size: 0.78rem;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      textarea {
        display: block;
        width: 100%;
        min-height: 460px;
        resize: vertical;
        padding: 14px;
        border: 0;
        border-radius: 0 0 8px 8px;
        font: 1rem/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }

      .stack {
        display: grid;
        gap: 16px;
      }

      .preview,
      output {
        display: block;
        min-height: 222px;
        padding: 16px;
        border: 0;
        border-radius: 0 0 8px 8px;
      }

      .preview {
        overflow-wrap: anywhere;
        font-size: 1.45rem;
        background: var(--panel);
      }

      output {
        overflow: auto;
        white-space: pre-wrap;
        color: var(--code);
        font: 0.92rem/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        background: var(--field);
      }

      mark {
        padding: 0 0.12em;
        background: color-mix(in srgb, var(--mark) 40%, transparent);
      }

      /* Canonical Inline Annotation stylesheet. */
${css.replace(/^(?=.)/gm, "      ")}

      @media (max-width: 820px) {
        main { width: min(100% - 24px, 1180px); }
        header { align-items: stretch; flex-direction: column; }
        .toolbar { justify-content: stretch; }
        select { width: 100%; }
        .workspace { grid-template-columns: 1fr; }
        textarea { min-height: 260px; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <h1>Inline Annotation</h1>
          <p class="meta">Core renderer playground. ${generatedNote}</p>
        </div>
        <div class="toolbar">
          <label>
            Fixture
            <select id="example"></select>
          </label>
          <label class="toggle">
            <input id="classMode" type="checkbox" />
            Class CSS
          </label>
        </div>
      </header>

      <section class="workspace">
        <div class="panel">
          <h2>Source</h2>
          <textarea id="source" spellcheck="false"></textarea>
        </div>
        <div class="stack">
          <div class="panel">
            <h2>Preview</h2>
            <div id="preview" class="preview"></div>
          </div>
          <div class="panel">
            <h2>HTML</h2>
            <output id="html"></output>
          </div>
        </div>
      </section>
    </main>

    <script type="module">
      import { renderInlineAnnotationsToHtml } from "../dist/core.mjs";

      const examples = ${scriptJson(fixtureExamples)};
      const source = document.getElementById("source");
      const preview = document.getElementById("preview");
      const html = document.getElementById("html");
      const select = document.getElementById("example");
      const classMode = document.getElementById("classMode");

      function render() {
        const rendered = renderInlineAnnotationsToHtml(source.value, {
          inlineStyles: !classMode.checked,
        });
        const withBreaks = rendered.replace(/\\n/g, "<br>");
        preview.innerHTML = withBreaks;
        html.textContent = withBreaks;
      }

      const custom = document.createElement("option");
      custom.value = "";
      custom.textContent = "Custom";
      select.append(custom);

      for (const item of examples) {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.category + " / " + item.name;
        select.append(option);
      }

      source.value = ${scriptJson(defaultSource)};
      render();

      source.addEventListener("input", () => {
        select.value = "";
        render();
      });

      select.addEventListener("change", () => {
        const item = examples.find((candidate) => candidate.id === select.value);
        if (!item) return;
        source.value = item.input;
        render();
      });

      classMode.addEventListener("change", render);
    </script>
  </body>
</html>
`;

writeFileSync(resolve(root, "examples/before-after.html"), beforeAfterHtml);
writeFileSync(resolve(root, "examples/playground.html"), playgroundHtml);
console.log("examples/before-after.html generated from live parser output");
console.log("examples/playground.html generated from core renderer and shared fixtures");
