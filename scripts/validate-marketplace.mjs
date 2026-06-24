import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const marketplacePath = join(repoRoot, ".agents/plugins/marketplace.json");

function fail(message) {
  console.error(`error: ${message}`);
  process.exitCode = 1;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
    return null;
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const marketplace = readJson(marketplacePath);

if (!marketplace) {
  process.exit(1);
}

if (!marketplace.name || typeof marketplace.name !== "string") {
  fail("marketplace.name must be a non-empty string");
}

if (!Array.isArray(marketplace.plugins)) {
  fail("marketplace.plugins must be an array");
  process.exit(1);
}

const seenNames = new Set();

for (const entry of marketplace.plugins) {
  if (!isObject(entry)) {
    fail("each marketplace plugin entry must be an object");
    continue;
  }

  if (!entry.name || typeof entry.name !== "string") {
    fail("plugin entry is missing name");
    continue;
  }

  if (seenNames.has(entry.name)) {
    fail(`duplicate plugin entry: ${entry.name}`);
  }
  seenNames.add(entry.name);

  if (!isObject(entry.source)) {
    fail(`${entry.name}: source must be an object`);
    continue;
  }

  if (entry.source.source !== "local") {
    fail(`${entry.name}: only local marketplace entries are supported by this validator`);
  }

  if (!entry.source.path || typeof entry.source.path !== "string") {
    fail(`${entry.name}: source.path must be a non-empty string`);
    continue;
  }

  if (!entry.source.path.startsWith("./")) {
    fail(`${entry.name}: source.path must start with ./`);
    continue;
  }

  const pluginRoot = join(repoRoot, entry.source.path);
  if (!existsSync(pluginRoot) || !statSync(pluginRoot).isDirectory()) {
    fail(`${entry.name}: plugin directory does not exist at ${entry.source.path}`);
    continue;
  }

  const manifestPath = join(pluginRoot, ".codex-plugin/plugin.json");
  if (!existsSync(manifestPath)) {
    fail(`${entry.name}: missing .codex-plugin/plugin.json`);
    continue;
  }

  const manifest = readJson(manifestPath);
  if (!manifest) {
    continue;
  }

  if (manifest.name !== entry.name) {
    fail(`${entry.name}: manifest name must match marketplace entry name`);
  }

  if (!manifest.version || typeof manifest.version !== "string") {
    fail(`${entry.name}: manifest.version must be a non-empty string`);
  }

  if (!manifest.description || typeof manifest.description !== "string") {
    fail(`${entry.name}: manifest.description must be a non-empty string`);
  }

  if (!isObject(manifest.interface)) {
    fail(`${entry.name}: manifest.interface must be an object`);
  }

  if (!isObject(entry.policy)) {
    fail(`${entry.name}: policy must be an object`);
  } else {
    if (!["AVAILABLE", "INSTALLED_BY_DEFAULT", "NOT_AVAILABLE"].includes(entry.policy.installation)) {
      fail(`${entry.name}: policy.installation is invalid`);
    }
    if (!["ON_INSTALL", "ON_USE"].includes(entry.policy.authentication)) {
      fail(`${entry.name}: policy.authentication is invalid`);
    }
  }

  if (!entry.category || typeof entry.category !== "string") {
    fail(`${entry.name}: category must be a non-empty string`);
  }
}

if (!process.exitCode) {
  console.log(`validated ${marketplace.plugins.length} marketplace plugin(s)`);
}
