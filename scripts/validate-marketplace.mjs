import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
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

function isInsideOrSameDirectory(parent, child) {
  const childRelativePath = relative(parent, child);
  return (
    childRelativePath === "" ||
    (childRelativePath !== ".." &&
      !childRelativePath.startsWith(`..${sep}`) &&
      !isAbsolute(childRelativePath))
  );
}

function localSourcePath(source) {
  if (typeof source === "string") {
    return source;
  }
  if (isObject(source) && source.source === "local" && typeof source.path === "string") {
    return source.path;
  }
  return null;
}

function manifestNameForPluginRoot(manifest, pluginRoot) {
  if (typeof manifest.name === "string" && manifest.name.trim()) {
    return manifest.name;
  }
  return basename(pluginRoot);
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
    return undefined;
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

function extractSkillFrontmatter(content) {
  const lines = content.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    return null;
  }

  const frontmatterLines = [];
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === "---") {
      if (frontmatterLines.length === 0) {
        return null;
      }
      return {
        frontmatterLines,
        body: lines.slice(index + 1).join("\n")
      };
    }
    frontmatterLines.push(lines[index]);
  }

  return null;
}

function unquoteYamlScalar(value) {
  if (value.length < 2) {
    return value;
  }

  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replaceAll("''", "'");
  }

  return value;
}

function looksLikeNonStringYamlScalar(value) {
  const lowerValue = value.toLowerCase();
  return (
    lowerValue === "null" ||
    lowerValue === "~" ||
    lowerValue === "true" ||
    lowerValue === "false" ||
    /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(value) ||
    value.startsWith("[") ||
    value.startsWith("{")
  );
}

function readBlockScalar(lines, startIndex) {
  const blockLines = [];
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      blockLines.push(line);
      continue;
    }
    if (/^[A-Za-z][\w-]*:/.test(line)) {
      break;
    }
    if (/^\s/.test(line)) {
      blockLines.push(line);
    } else {
      break;
    }
  }

  return blockLines.join("\n").trim();
}

function readFrontmatterValue(lines, key) {
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!match || match[1] !== key) {
      continue;
    }

    const rawValue = match[2].trim();
    if (/^[|>][+-]?$/.test(rawValue)) {
      return readBlockScalar(lines, index + 1);
    }
    if (looksLikeNonStringYamlScalar(rawValue)) {
      return undefined;
    }
    return unquoteYamlScalar(rawValue).trim();
  }

  return undefined;
}

function validateSkillFile(pluginName, skillDirName, skillPath, fail) {
  if (!existsSync(skillPath) || !statSync(skillPath).isFile()) {
    fail(`${pluginName}: missing skills/${skillDirName}/SKILL.md`);
    return false;
  }

  const content = readFileSync(skillPath, "utf8");
  const frontmatter = extractSkillFrontmatter(content);
  if (!frontmatter) {
    fail(`${pluginName}: skills/${skillDirName}/SKILL.md is missing YAML frontmatter`);
    return false;
  }

  const skillName = readFrontmatterValue(frontmatter.frontmatterLines, "name");
  const description = readFrontmatterValue(frontmatter.frontmatterLines, "description");

  let isValid = true;
  if (skillName !== skillDirName) {
    fail(`${pluginName}: skills/${skillDirName}/SKILL.md frontmatter name must match directory`);
    isValid = false;
  }
  if (!description) {
    fail(`${pluginName}: skills/${skillDirName}/SKILL.md frontmatter description is required`);
    isValid = false;
  }
  if (!frontmatter.body.trim()) {
    fail(`${pluginName}: skills/${skillDirName}/SKILL.md body is required`);
    isValid = false;
  }

  return isValid;
}

function validateSkillRoot(pluginName, pluginRoot, skillsPath, fail) {
  if (typeof skillsPath !== "string") {
    return 0;
  }

  const skillsRoot = resolve(pluginRoot, skillsPath);
  if (!isInsideDirectory(pluginRoot, skillsRoot)) {
    fail(`${pluginName}: manifest.skills path ${skillsPath} must stay inside the plugin directory`);
    return 0;
  }

  if (!existsSync(skillsRoot) || !statSync(skillsRoot).isDirectory()) {
    fail(`${pluginName}: skills directory does not exist at ${skillsPath}`);
    return 0;
  }

  if (!isInsideDirectory(realpathSync(pluginRoot), realpathSync(skillsRoot))) {
    fail(
      `${pluginName}: manifest.skills path ${skillsPath} must not resolve outside the plugin directory`
    );
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

function validateSkills(pluginName, pluginRoot, manifest, fail) {
  const usesDefaultSkillRoot =
    manifest.skills === undefined ||
    (Array.isArray(manifest.skills) && manifest.skills.length === 0);
  if (usesDefaultSkillRoot) {
    const defaultSkillsRoot = join(pluginRoot, "skills");
    if (!existsSync(defaultSkillsRoot)) {
      return 0;
    }
    return validateSkillRoot(pluginName, pluginRoot, "./skills", fail);
  }

  const skillPaths = Array.isArray(manifest.skills) ? manifest.skills : [manifest.skills];
  return skillPaths.reduce(
    (skillCount, skillsPath) =>
      skillCount + validateSkillRoot(pluginName, pluginRoot, skillsPath, fail),
    0
  );
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

  if (
    marketplace === undefined ||
    marketplaceSchema === undefined ||
    pluginSchema === undefined
  ) {
    return { ok: false, errors, pluginCount: 0, skillCount: 0 };
  }

  const validateMarketplace = compileSchema(ajv, marketplaceSchema, marketplaceSchemaPath, fail);
  const validatePlugin = compileSchema(ajv, pluginSchema, pluginSchemaPath, fail);

  if (!validateMarketplace || !validatePlugin) {
    return { ok: false, errors, pluginCount: 0, skillCount: 0 };
  }

  validateJson(marketplacePath, marketplace, validateMarketplace, fail);

  if (!isObject(marketplace) || !Array.isArray(marketplace.plugins)) {
    return { ok: false, errors, pluginCount: 0, skillCount: 0 };
  }

  const seenNames = new Set();
  let skillCount = 0;

  for (const entry of marketplace.plugins) {
    if (!isObject(entry) || !entry.name) {
      continue;
    }

    if (seenNames.has(entry.name)) {
      fail(`duplicate plugin entry: ${entry.name}`);
    }
    seenNames.add(entry.name);

    const sourcePath = localSourcePath(entry.source);
    if (sourcePath === null) {
      continue;
    }

    const pluginRoot = resolve(repoRoot, sourcePath);
    if (!isInsideOrSameDirectory(repoRoot, pluginRoot)) {
      fail(`${entry.name}: source.path must stay inside the repository`);
      continue;
    }

    if (!existsSync(pluginRoot) || !statSync(pluginRoot).isDirectory()) {
      fail(`${entry.name}: plugin directory does not exist at ${sourcePath}`);
      continue;
    }

    if (!isInsideOrSameDirectory(realRepoRoot, realpathSync(pluginRoot))) {
      fail(`${entry.name}: source.path must not resolve outside the repository`);
      continue;
    }

    const manifestPath = join(pluginRoot, ".codex-plugin/plugin.json");
    if (!existsSync(manifestPath)) {
      fail(`${entry.name}: missing .codex-plugin/plugin.json`);
      continue;
    }

    const manifest = readJson(manifestPath, fail);
    if (manifest === undefined) {
      continue;
    }

    validateJson(manifestPath, manifest, validatePlugin, fail);

    if (!isObject(manifest)) {
      continue;
    }

    if (manifestNameForPluginRoot(manifest, pluginRoot) !== entry.name) {
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
