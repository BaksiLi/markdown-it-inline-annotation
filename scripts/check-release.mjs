import { spawnSync } from "node:child_process";
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
  "const core = require('markdown-it-inline-annotation/core'); const corpus = require('markdown-it-inline-annotation/fixtures/html-render.json'); if (typeof core.renderInlineAnnotationsToHtml !== 'function') process.exit(1); if (corpus.version !== 1 || !Array.isArray(corpus.cases) || corpus.cases.length === 0) process.exit(1); console.log('self-reference exports ok:', corpus.cases.length, 'fixtures');",
]);
run(git, ["diff", "--check"], { env: process.env });
run(npm, ["pack", "--dry-run"]);
