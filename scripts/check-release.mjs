import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const git = process.platform === "win32" ? "git.cmd" : "git";
const node = process.execPath;
const npmCache = join(tmpdir(), "npm-cache-inline-annotation");

function run(command, args, options = {}) {
  const label = [command, ...args].join(" ");
  console.log(`\n> ${label}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, npm_config_cache: npmCache },
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(npm, ["test"]);
run(npm, ["run", "build:examples"]);
run(node, [
  "-e",
  "const core = require('markdown-it-inline-annotation/core'); const corpus = require('markdown-it-inline-annotation/fixtures/html-render.json'); const boundaries = require('markdown-it-inline-annotation/fixtures/segment-boundaries.json'); if (typeof core.renderInlineAnnotationsToHtml !== 'function') process.exit(1); if (corpus.version !== 1 || !Array.isArray(corpus.cases) || corpus.cases.length === 0) process.exit(1); if (boundaries.version !== 1 || !Array.isArray(boundaries.cases) || boundaries.cases.length === 0) process.exit(1); console.log('self-reference exports ok:', corpus.cases.length, 'render fixtures,', boundaries.cases.length, 'boundary fixtures');",
]);
run(git, ["diff", "--check"], { env: process.env });

const releaseRoot = mkdtempSync(join(tmpdir(), "inline-annotation-release-"));
try {
  run(npm, ["pack", "--pack-destination", releaseRoot]);
  const tarball = readdirSync(releaseRoot).find((name) => name.endsWith(".tgz"));
  if (!tarball) throw new Error("npm pack did not produce a tarball");

  const consumer = join(releaseRoot, "core-consumer");
  mkdirSync(consumer);
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ private: true }, null, 2));
  run(npm, [
    "install",
    "--ignore-scripts",
    "--no-package-lock",
    "--no-audit",
    "--no-fund",
    "--offline",
    join(releaseRoot, tarball),
  ], { cwd: consumer });
  run(node, [
    "-e",
    "const core = require('markdown-it-inline-annotation/core'); if (typeof core.findInlineAnnotationModel !== 'function') process.exit(1); try { require.resolve('markdown-it'); process.exit(2); } catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; } console.log('core-only install ok: markdown-it absent');",
  ], { cwd: consumer });
} finally {
  rmSync(releaseRoot, { recursive: true, force: true });
}
