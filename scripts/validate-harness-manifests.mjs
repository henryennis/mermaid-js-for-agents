#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const REQUIRED_PACKED_FILES = [
  "skills/mermaid-diagrams/SKILL.md",
  "tile.json",
  ".claude-plugin/plugin.json",
  ".codex-plugin/plugin.json",
  ".agents/plugins/marketplace.json",
  "README.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md"
];

function readJson(relativePath, root = ROOT) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

function assertPath(errors, relativePath, { root = ROOT, label = relativePath } = {}) {
  if (!relativePath || typeof relativePath !== "string") {
    errors.push(`${label}: expected a path string`);
    return;
  }
  if (!existsSync(path.join(root, relativePath)))
    errors.push(`${label}: path does not exist (${relativePath})`);
}

function assertMarketplaceSource(errors, plugin, { root = ROOT } = {}) {
  const label = `.agents/plugins/marketplace.json plugin ${plugin.name} source`;
  const source = plugin.source;
  if (typeof source === "string") {
    if (/^(https?:|git@|github:)/.test(source)) return;
    assertPath(errors, source, { root, label });
    return;
  }
  assertPath(errors, source?.path, { root, label: `${label}.path` });
}

export function validateRepoManifests({ root = ROOT } = {}) {
  const errors = [];

  const packageJson = readJson("package.json", root);
  for (const skillsPath of packageJson.pi?.skills ?? []) {
    assertPath(errors, skillsPath, { root, label: "package.json pi.skills" });
  }

  const piSettings = readJson(".pi/settings.json", root);
  for (const skillsPath of piSettings.skills ?? []) {
    assertPath(errors, skillsPath, { root, label: ".pi/settings.json skills" });
  }

  const tile = readJson("tile.json", root);
  assertPath(errors, tile.entrypoint, { root, label: "tile.json entrypoint" });
  assertPath(errors, tile.docs, { root, label: "tile.json docs" });
  for (const [name, skill] of Object.entries(tile.skills ?? {})) {
    assertPath(errors, skill.path, { root, label: `tile.json skills.${name}.path` });
  }
  for (const [name, steering] of Object.entries(tile.steering ?? {})) {
    assertPath(errors, steering.rules, { root, label: `tile.json steering.${name}.rules` });
  }

  const claudePlugin = readJson(".claude-plugin/plugin.json", root);
  if (!claudePlugin.name || !claudePlugin.version) {
    errors.push(".claude-plugin/plugin.json: expected name and version");
  }
  // Claude Code plugin skills are discovered from package-root skills/; the manifest is metadata.
  assertPath(errors, "skills/mermaid-diagrams/SKILL.md", {
    root,
    label: "Claude package-root skill"
  });

  const codexPlugin = readJson(".codex-plugin/plugin.json", root);
  assertPath(errors, codexPlugin.skills, {
    root,
    label: ".codex-plugin/plugin.json skills (package-root relative)"
  });

  const marketplace = readJson(".agents/plugins/marketplace.json", root);
  for (const plugin of marketplace.plugins ?? []) {
    assertMarketplaceSource(errors, plugin, { root });
  }

  return errors;
}

export function validatePackedFiles(files, required = REQUIRED_PACKED_FILES) {
  const packed = new Set(files.map((file) => file.replace(/^package\//, "")));
  return required
    .filter((requiredFile) => !packed.has(requiredFile))
    .map((requiredFile) => `npm package is missing ${requiredFile}`);
}

function runPackDryRun() {
  const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: ROOT,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`npm pack --dry-run failed:\n${result.stderr || result.stdout}`);
  }
  const [pack] = JSON.parse(result.stdout);
  return pack.files.map((file) => file.path);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pack = process.argv.includes("--pack");
  const errors = validateRepoManifests();
  if (pack) errors.push(...validatePackedFiles(runPackDryRun()));

  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(`Harness manifest validation passed${pack ? " (including npm pack smoke)" : ""}.`);
}
