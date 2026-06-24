import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const realRepoRoot = realpathSync(repoRoot);
const marketplacePath = join(repoRoot, ".agents/plugins/marketplace.json");
const marketplaceSchemaPath = join(repoRoot, "schemas/marketplace.schema.json");
const pluginSchemaPath = join(repoRoot, "schemas/plugin.schema.json");

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

function isInsideDirectory(parent, child) {
  const childRelativePath = relative(parent, child);
  return (
    !!childRelativePath &&
    childRelativePath !== ".." &&
    !childRelativePath.startsWith(`..${sep}`) &&
    !isAbsolute(childRelativePath)
  );
}

function compileSchema(ajv, schema, path) {
  try {
    return ajv.compile(schema);
  } catch (error) {
    fail(`${path} is not a valid JSON Schema: ${error.message}`);
    return null;
  }
}

function formatSchemaLocation(error) {
  if (error.instancePath) {
    return error.instancePath;
  }
  if (error.params?.missingProperty) {
    return `/${error.params.missingProperty}`;
  }
  return "/";
}

function validateJson(path, value, validate) {
  if (validate(value)) {
    return;
  }

  for (const error of validate.errors ?? []) {
    fail(`${path}${formatSchemaLocation(error)} ${error.message}`);
  }
}

function validateSkillFile(pluginName, skillDirName, skillPath) {
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

  if (metadata.get("name") !== skillDirName) {
    fail(`${pluginName}: skills/${skillDirName}/SKILL.md frontmatter name must match directory`);
  }
  if (!metadata.get("description")) {
    fail(`${pluginName}: skills/${skillDirName}/SKILL.md frontmatter description is required`);
  }

  return true;
}

function validateSkills(pluginName, pluginRoot, manifest) {
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
    if (validateSkillFile(pluginName, skillDirName, skillPath)) {
      validSkillCount += 1;
    }
  }

  return validSkillCount;
}

const ajv = new Ajv({ allErrors: true });
const marketplace = readJson(marketplacePath);
const marketplaceSchema = readJson(marketplaceSchemaPath);
const pluginSchema = readJson(pluginSchemaPath);

if (!marketplace || !marketplaceSchema || !pluginSchema) {
  process.exit(1);
}

const validateMarketplace = compileSchema(ajv, marketplaceSchema, marketplaceSchemaPath);
const validatePlugin = compileSchema(ajv, pluginSchema, pluginSchemaPath);

if (!validateMarketplace || !validatePlugin) {
  process.exit(1);
}

validateJson(marketplacePath, marketplace, validateMarketplace);

if (!Array.isArray(marketplace.plugins)) {
  process.exit(1);
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

  const manifest = readJson(manifestPath);
  if (!manifest) {
    continue;
  }

  validateJson(manifestPath, manifest, validatePlugin);

  if (manifest.name !== entry.name) {
    fail(`${entry.name}: manifest name must match marketplace entry name`);
  }

  skillCount += validateSkills(entry.name, pluginRoot, manifest);
}

if (!process.exitCode) {
  console.log(`validated ${marketplace.plugins.length} marketplace plugin(s) and ${skillCount} skill(s)`);
}
