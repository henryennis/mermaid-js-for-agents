#!/usr/bin/env node
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  renameSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PACKAGE_ROOT = path.resolve(SCRIPT_DIR, "..");
const SKILL_RELATIVE_PATH = path.join("skills", "mermaid-diagrams");
const LINK_PATHS = [
  path.join(".agents", "skills", "mermaid-diagrams"),
  path.join(".claude", "skills", "mermaid-diagrams")
];

function usage() {
  return `Usage: npm run install:local -- --target <project-dir> [--force]\n\nInstalls project-local links for Mermaid.js for Agents without mutating global harness config.\n\nOptions:\n  --target <dir>  Existing project directory to update.\n  --force         Back up and replace conflicting local files/directories.\n  --help          Show this help.\n`;
}

export function parseArgs(argv) {
  const options = { force: false, help: false, target: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--force") {
      options.force = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--target") {
      options.target = argv[index + 1];
      index += 1;
    } else if (arg.startsWith("--target=")) {
      options.target = arg.slice("--target=".length);
    } else {
      throw new Error(`Unknown argument: ${arg}\n\n${usage()}`);
    }
  }
  return options;
}

function assertDirectory(directory, label) {
  try {
    if (!statSync(directory).isDirectory())
      throw new Error(`${label} is not a directory: ${directory}`);
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`${label} does not exist: ${directory}`);
    throw error;
  }
}

function toPortableRelative(fromDirectory, toPath) {
  const relative = path.relative(fromDirectory, toPath) || ".";
  const portable = relative.split(path.sep).join("/");
  return portable.startsWith(".") ? portable : `./${portable}`;
}

function symlinkTargetPath(linkPath) {
  const rawTarget = readlinkSync(linkPath);
  return path.resolve(path.dirname(linkPath), rawTarget);
}

function isOwnedSymlink(linkPath, expectedTarget) {
  try {
    const stat = lstatSync(linkPath);
    if (!stat.isSymbolicLink()) return false;
    return symlinkTargetPath(linkPath) === expectedTarget;
  } catch {
    return false;
  }
}

function backupPath(originalPath) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  let candidate = `${originalPath}.backup-${stamp}`;
  let suffix = 0;
  while (existsSync(candidate)) {
    suffix += 1;
    candidate = `${originalPath}.backup-${stamp}-${suffix}`;
  }
  return candidate;
}

function moveAside(existingPath) {
  const backup = backupPath(existingPath);
  renameSync(existingPath, backup);
  return backup;
}

export function ensureOwnedSymlink({ linkPath, targetPath, force = false }) {
  mkdirSync(path.dirname(linkPath), { recursive: true });
  if (existsSync(linkPath)) {
    if (isOwnedSymlink(linkPath, targetPath)) {
      unlinkSync(linkPath);
    } else if (force) {
      const backup = moveAside(linkPath);
      console.log(`Backed up ${linkPath} -> ${backup}`);
    } else {
      throw new Error(
        `Refusing to replace existing path: ${linkPath}\n` +
          "Re-run with --force to back it up and replace it."
      );
    }
  }

  const relativeTarget = path
    .relative(path.dirname(linkPath), targetPath)
    .split(path.sep)
    .join("/");
  symlinkSync(relativeTarget, linkPath, process.platform === "win32" ? "junction" : "dir");
  console.log(`${linkPath} -> ${relativeTarget}`);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function readPiSettingsForInstall(settingsPath, { force = false } = {}) {
  if (!existsSync(settingsPath)) return {};
  let settings;
  try {
    settings = readJson(settingsPath);
  } catch (error) {
    if (!force) {
      throw new Error(
        `Refusing to overwrite invalid JSON in ${settingsPath}: ${error.message}\n` +
          "Fix the file or re-run with --force to back it up."
      );
    }
    const backup = moveAside(settingsPath);
    console.log(`Backed up invalid ${settingsPath} -> ${backup}`);
    return {};
  }

  if (!isPlainObject(settings)) {
    if (!force) throw new Error(`Expected ${settingsPath} to contain a JSON object.`);
    const backup = moveAside(settingsPath);
    console.log(`Backed up non-object ${settingsPath} -> ${backup}`);
    return {};
  }
  if (settings.skills !== undefined && !Array.isArray(settings.skills)) {
    if (!force) throw new Error(`Expected ${settingsPath} field "skills" to be an array.`);
    settings.skills = [];
  }
  return settings;
}

function preflightInstall({ linkTargets, settingsPath, force = false }) {
  for (const { linkPath, targetPath } of linkTargets) {
    if (existsSync(linkPath) && !isOwnedSymlink(linkPath, targetPath) && !force) {
      throw new Error(
        `Refusing to replace existing path: ${linkPath}\n` +
          "Re-run with --force to back it up and replace it."
      );
    }
  }
  readPiSettingsForInstall(settingsPath, { force });
}

export function mergePiSettings({ settingsPath, skillsPath, force = false }) {
  mkdirSync(path.dirname(settingsPath), { recursive: true });
  const settings = readPiSettingsForInstall(settingsPath, { force });
  if (settings.skills === undefined) settings.skills = [];
  if (!settings.skills.includes(skillsPath)) settings.skills.push(skillsPath);
  writeJson(settingsPath, settings);
  console.log(`${settingsPath} loads ${skillsPath} for Pi project sessions.`);
}

export function installLocal({ packageRoot = DEFAULT_PACKAGE_ROOT, targetDir, force = false }) {
  if (!targetDir) throw new Error(`Missing required --target.\n\n${usage()}`);
  const resolvedPackageRoot = path.resolve(packageRoot);
  const resolvedTargetDir = path.resolve(targetDir);
  const skillDir = path.join(resolvedPackageRoot, SKILL_RELATIVE_PATH);

  assertDirectory(resolvedPackageRoot, "Package root");
  assertDirectory(skillDir, "Skill directory");
  assertDirectory(resolvedTargetDir, "Target directory");

  const linkTargets = LINK_PATHS.map((relativeLinkPath) => ({
    linkPath: path.join(resolvedTargetDir, relativeLinkPath),
    targetPath: skillDir
  }));
  const settingsPath = path.join(resolvedTargetDir, ".pi", "settings.json");
  preflightInstall({ linkTargets, settingsPath, force });

  for (const linkTarget of linkTargets) {
    ensureOwnedSymlink({ ...linkTarget, force });
  }

  mergePiSettings({
    settingsPath,
    skillsPath: toPortableRelative(resolvedTargetDir, path.join(resolvedPackageRoot, "skills")),
    force
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      process.exit(0);
    }
    installLocal({ targetDir: options.target, force: options.force });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
