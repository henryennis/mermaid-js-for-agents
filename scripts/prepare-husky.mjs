#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import process from "node:process";

if (process.env.CI === "true" || process.env.CI === "1") {
  process.exit(0);
}

if (!existsSync(".git")) {
  process.exit(0);
}

const result = spawnSync("husky", { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
