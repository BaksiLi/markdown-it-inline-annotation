import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const files = ["core", "index"];

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist", { recursive: true });

const declarations = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsc", "--emitDeclarationOnly", "--declaration", "--declarationDir", "dist"],
  { stdio: "inherit" }
);

if (declarations.status !== 0) {
  process.exit(declarations.status ?? 1);
}

for (const file of files) {
  const source = readFileSync(`src/${file}.ts`, "utf8");

  const cjs = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
    fileName: `${file}.ts`,
  }).outputText;
  writeFileSync(`dist/${file}.js`, cjs);

  let esm = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ES2020,
      esModuleInterop: true,
    },
    fileName: `${file}.ts`,
  }).outputText;
  esm = esm.replace(/from "\.\/core"/g, 'from "./core.mjs"');
  writeFileSync(`dist/${file}.mjs`, esm);
}
