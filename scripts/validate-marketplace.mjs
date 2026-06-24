import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv from "ajv";

const defaultRepoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isInsideDirectory(parent, child) {
  const childRelativePath = relative(parent, child);
  return (
    !!childRelativePath &&
    childRelativePath !== ".." &&
    !childRelativePath.startsWith(`..${sep}`) &&
    !isAbsolute(childRelativePath)
  );
}

function formatSchemaLocation(error) {
  const basePath = error.instancePath || "";
  if (error.params?.missingProperty) {
    return `${basePath}/${error.params.missingProperty}`;
  }
  return basePath || "/";
}

function compileSchema(ajv, schema, path, fail) {
  try {
    return ajv.compile(schema);
  } catch (error) {
    fail(`${path} is not a valid JSON Schema: ${error.message}`);
    return null;
  }
}

function readJson(path, fail) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
    return null;
  }
}

function validateJson(path, value, validate, fail) {
  if (validate(value)) {
    return;
  }

  for (const error of validate.errors ?? []) {
    fail(`${path}${formatSchemaLocation(error)} ${error.message}`);
  }
}

function validateSkillFile(pluginName, skillDirName, skillPath, fail) {
  if (!existsSync(skillPath) || !statSync(skillPath).isFile()) {
    fail(`${pluginName}: missing skills/${skillDirName}/SKILL.md`);
    return false;
  }

  const content = readFileSync(skillPath, "utf8");
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) {
    fail(`${pluginName}: skills/${skillDirName}/SKILL.md is missing YAML frontmatter`);
    return false;
  }

  const metadata = new Map();
  for (const line of frontmatterMatch[1].split("\n")) {
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (match) {
      metadata.set(match[1], match[2].trim());
    }
  }

  let isValid = true;
  if (metadata.get("name") !== skillDirName) {
    fail(`${pluginName}: skills/${skillDirName}/SKILL.md frontmatter name must match directory`);
    isValid = false;
  }
  if (!metadata.get("description")) {
    fail(`${pluginName}: skills/${skillDirName}/SKILL.md frontmatter description is required`);
    isValid = false;
  }

  return isValid;
}

function validateSkills(pluginName, pluginRoot, manifest, fail) {
  if (!manifest.skills || typeof manifest.skills !== "string") {
    return 0;
  }

  const skillsRoot = resolve(pluginRoot, manifest.skills);
  if (!isInsideDirectory(pluginRoot, skillsRoot)) {
    fail(`${pluginName}: manifest.skills must stay inside the plugin directory`);
    return 0;
  }

  if (!existsSync(skillsRoot) || !statSync(skillsRoot).isDirectory()) {
    fail(`${pluginName}: skills directory does not exist at ${manifest.skills}`);
    return 0;
  }

  if (!isInsideDirectory(realpathSync(pluginRoot), realpathSync(skillsRoot))) {
    fail(`${pluginName}: manifest.skills must not resolve outside the plugin directory`);
    return 0;
  }

  const skillDirectories = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (skillDirectories.length === 0) {
    fail(`${pluginName}: skills directory must contain at least one skill directory`);
  }

  let validSkillCount = 0;
  for (const skillDirName of skillDirectories) {
    const skillPath = join(skillsRoot, skillDirName, "SKILL.md");
    if (validateSkillFile(pluginName, skillDirName, skillPath, fail)) {
      validSkillCount += 1;
    }
  }

  return validSkillCount;
}

export function validateRepository(root = defaultRepoRoot) {
  const repoRoot = resolve(root);
  const errors = [];
  const fail = (message) => errors.push(message);
  const marketplacePath = join(repoRoot, ".agents/plugins/marketplace.json");
  const marketplaceSchemaPath = join(repoRoot, "schemas/marketplace.schema.json");
  const pluginSchemaPath = join(repoRoot, "schemas/plugin.schema.json");

  let realRepoRoot;
  try {
    realRepoRoot = realpathSync(repoRoot);
  } catch (error) {
    fail(`${repoRoot} is not accessible: ${error.message}`);
    return { ok: false, errors, pluginCount: 0, skillCount: 0 };
  }

  const ajv = new Ajv({ allErrors: true });
  const marketplace = readJson(marketplacePath, fail);
  const marketplaceSchema = readJson(marketplaceSchemaPath, fail);
  const pluginSchema = readJson(pluginSchemaPath, fail);

  if (!marketplace || !marketplaceSchema || !pluginSchema) {
    return { ok: false, errors, pluginCount: 0, skillCount: 0 };
  }

  const validateMarketplace = compileSchema(ajv, marketplaceSchema, marketplaceSchemaPath, fail);
  const validatePlugin = compileSchema(ajv, pluginSchema, pluginSchemaPath, fail);

  if (!validateMarketplace || !validatePlugin) {
    return { ok: false, errors, pluginCount: 0, skillCount: 0 };
  }

  validateJson(marketplacePath, marketplace, validateMarketplace, fail);

  if (!Array.isArray(marketplace.plugins)) {
    return { ok: false, errors, pluginCount: 0, skillCount: 0 };
  }

  const seenNames = new Set();
  let skillCount = 0;

  for (const entry of marketplace.plugins) {
    if (
      !isObject(entry) ||
      !entry.name ||
      !isObject(entry.source) ||
      typeof entry.source.path !== "string"
    ) {
      continue;
    }

    if (seenNames.has(entry.name)) {
      fail(`duplicate plugin entry: ${entry.name}`);
    }
    seenNames.add(entry.name);

    const pluginRoot = resolve(repoRoot, entry.source.path);
    if (!isInsideDirectory(repoRoot, pluginRoot)) {
      fail(`${entry.name}: source.path must stay inside the repository`);
      continue;
    }

    if (!existsSync(pluginRoot) || !statSync(pluginRoot).isDirectory()) {
      fail(`${entry.name}: plugin directory does not exist at ${entry.source.path}`);
      continue;
    }

    if (!isInsideDirectory(realRepoRoot, realpathSync(pluginRoot))) {
      fail(`${entry.name}: source.path must not resolve outside the repository`);
      continue;
    }

    const manifestPath = join(pluginRoot, ".codex-plugin/plugin.json");
    if (!existsSync(manifestPath)) {
      fail(`${entry.name}: missing .codex-plugin/plugin.json`);
      continue;
    }

    const manifest = readJson(manifestPath, fail);
    if (!manifest) {
      continue;
    }

    validateJson(manifestPath, manifest, validatePlugin, fail);

    if (manifest.name !== entry.name) {
      fail(`${entry.name}: manifest name must match marketplace entry name`);
    }

    skillCount += validateSkills(entry.name, pluginRoot, manifest, fail);
  }

  return {
    ok: errors.length === 0,
    errors,
    pluginCount: marketplace.plugins.length,
    skillCount
  };
}

function isCliEntrypoint() {
  return process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
}

if (isCliEntrypoint()) {
  const result = validateRepository();
  for (const error of result.errors) {
    console.error(`error: ${error}`);
  }

  if (result.ok) {
    console.log(`validated ${result.pluginCount} marketplace plugin(s) and ${result.skillCount} skill(s)`);
  } else {
    process.exitCode = 1;
  }
}
