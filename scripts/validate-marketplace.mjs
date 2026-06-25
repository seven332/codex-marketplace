import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv from "ajv";
import { isScalar, parseDocument } from "yaml";

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

function normalizedDefaultPrompt(prompt) {
  return prompt.split(/\s+/u).filter(Boolean).join(" ");
}

function characterCount(value) {
  return Array.from(value).length;
}

function validateDefaultPrompt(path, manifest, fail) {
  const interfaceConfig = manifest.interface;
  if (!isObject(interfaceConfig) || !Object.hasOwn(interfaceConfig, "defaultPrompt")) {
    return;
  }

  const prompts =
    typeof interfaceConfig.defaultPrompt === "string"
      ? [{ value: interfaceConfig.defaultPrompt, location: "/interface/defaultPrompt" }]
      : Array.isArray(interfaceConfig.defaultPrompt)
        ? interfaceConfig.defaultPrompt.map((value, index) => ({
            value,
            location: `/interface/defaultPrompt/${index}`
          }))
        : [];

  for (const prompt of prompts) {
    if (typeof prompt.value !== "string") {
      continue;
    }
    if (characterCount(normalizedDefaultPrompt(prompt.value)) > 128) {
      fail(`${path}${prompt.location} must be at most 128 characters after whitespace normalization`);
    }
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

function stripYamlLineComment(value) {
  let quote = null;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote === '"') {
      if (character === '"' && value[index - 1] !== "\\") {
        quote = null;
      }
      continue;
    }
    if (quote === "'") {
      if (character === "'" && value[index + 1] === "'") {
        index += 1;
      } else if (character === "'") {
        quote = null;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === "#" && (index === 0 || /\s/.test(value[index - 1]))) {
      return value.slice(0, index).trim();
    }
  }

  return value.trim();
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

function readFrontmatterValueFallback(lines, key) {
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!match || match[1] !== key) {
      continue;
    }

    const rawValue = match[2].trim();
    if (/^[|>][+-]?$/.test(rawValue)) {
      return readBlockScalar(lines, index + 1);
    }
    const value = stripYamlLineComment(rawValue);
    if (looksLikeNonStringYamlScalar(value)) {
      return undefined;
    }
    return unquoteYamlScalar(value).trim();
  }

  return undefined;
}

function scalarStringFromYamlDocument(document, key) {
  const value = document.get(key, true);
  if (!isScalar(value) || typeof value.value !== "string") {
    return undefined;
  }

  return value.value.trim();
}

function readFrontmatterValues(lines) {
  const document = parseDocument(lines.join("\n"), { prettyErrors: false });
  if (document.errors.length > 0) {
    return {
      name: readFrontmatterValueFallback(lines, "name"),
      description: readFrontmatterValueFallback(lines, "description")
    };
  }

  return {
    name: scalarStringFromYamlDocument(document, "name"),
    description: scalarStringFromYamlDocument(document, "description")
  };
}

function skillFileLabel(skillsPath, skillDirName) {
  return `${skillsPath.replace(/[\\/]+$/u, "")}/${skillDirName}/SKILL.md`;
}

function skillDirectoryLabel(skillsPath, skillDirName) {
  return `${skillsPath.replace(/[\\/]+$/u, "")}/${skillDirName}`;
}

function validateInterfaceString(pluginName, label, fieldName, value, fail) {
  if (value === undefined) {
    return true;
  }
  if (typeof value !== "string" || !value.trim()) {
    fail(`${pluginName}: ${label}/interface/${fieldName} must be a non-empty string`);
    return false;
  }
  return true;
}

function validateAgentsOpenaiYaml(pluginName, skillsPath, skillDirName, skillDirPath, fail) {
  const skillDirectory = skillDirectoryLabel(skillsPath, skillDirName);
  const agentsPath = join(skillDirPath, "agents");
  let agentsStats;
  try {
    agentsStats = lstatSync(agentsPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return true;
    }
    fail(`${pluginName}: ${skillDirectory}/agents is not accessible: ${error.message}`);
    return false;
  }

  if (agentsStats.isSymbolicLink()) {
    fail(`${pluginName}: ${skillDirectory}/agents symlink is not allowed`);
    return false;
  }
  if (!agentsStats.isDirectory()) {
    fail(`${pluginName}: ${skillDirectory}/agents must be a directory`);
    return false;
  }

  const metadataPath = join(agentsPath, "openai.yaml");
  let metadataStats;
  try {
    metadataStats = lstatSync(metadataPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return true;
    }
    fail(`${pluginName}: ${skillDirectory}/agents/openai.yaml is not accessible: ${error.message}`);
    return false;
  }

  const label = `${skillDirectory}/agents/openai.yaml`;
  if (metadataStats.isSymbolicLink()) {
    fail(`${pluginName}: ${label} symlink is not allowed`);
    return false;
  }
  if (!metadataStats.isFile()) {
    fail(`${pluginName}: ${label} must be a file`);
    return false;
  }
  if (!isInsideDirectory(realpathSync(skillDirPath), realpathSync(metadataPath))) {
    fail(`${pluginName}: ${label} must not resolve outside the skill directory`);
    return false;
  }

  const document = parseDocument(readFileSync(metadataPath, "utf8"), { prettyErrors: false });
  if (document.errors.length > 0) {
    fail(`${pluginName}: ${label} is not valid YAML: ${document.errors[0].message}`);
    return false;
  }

  const metadata = document.toJS();
  if (!isObject(metadata)) {
    fail(`${pluginName}: ${label} must contain a YAML object`);
    return false;
  }

  let isValid = true;
  const knownTopLevelSections = ["interface", "dependencies", "policy"];
  if (!knownTopLevelSections.some((section) => Object.hasOwn(metadata, section))) {
    fail(`${pluginName}: ${label} must contain interface, dependencies, or policy`);
    isValid = false;
  }

  for (const fieldName of ["display_name", "short_description", "default_prompt"]) {
    if (Object.hasOwn(metadata, fieldName)) {
      fail(`${pluginName}: ${label}/${fieldName} must be nested under interface`);
      isValid = false;
    }
  }

  const interfaceConfig = metadata.interface;
  if (interfaceConfig === undefined) {
    return isValid;
  }

  if (!isObject(interfaceConfig)) {
    fail(`${pluginName}: ${label}/interface must be an object`);
    return false;
  }

  isValid =
    validateInterfaceString(pluginName, label, "display_name", interfaceConfig.display_name, fail) &&
    isValid;
  isValid =
    validateInterfaceString(
      pluginName,
      label,
      "short_description",
      interfaceConfig.short_description,
      fail
    ) && isValid;
  isValid =
    validateInterfaceString(
      pluginName,
      label,
      "default_prompt",
      interfaceConfig.default_prompt,
      fail
    ) &&
    isValid;

  if (typeof interfaceConfig.short_description === "string") {
    const length = characterCount(interfaceConfig.short_description.trim());
    if (length < 25 || length > 64) {
      fail(`${pluginName}: ${label}/interface/short_description must be 25-64 characters`);
      isValid = false;
    }
  }

  if (
    typeof interfaceConfig.default_prompt === "string" &&
    !interfaceConfig.default_prompt.includes(`$${skillDirName}`)
  ) {
    fail(`${pluginName}: ${label}/interface/default_prompt must mention $${skillDirName}`);
    isValid = false;
  }

  return isValid;
}

function validateSkillFile(pluginName, skillsPath, skillDirName, skillPath, fail) {
  const label = skillFileLabel(skillsPath, skillDirName);
  let skillStats;
  try {
    skillStats = lstatSync(skillPath);
  } catch {
    fail(`${pluginName}: missing ${label}`);
    return false;
  }
  if (skillStats.isSymbolicLink()) {
    fail(`${pluginName}: ${label} symlink is not allowed`);
    return false;
  }
  if (!skillStats.isFile()) {
    fail(`${pluginName}: missing ${label}`);
    return false;
  }

  const content = readFileSync(skillPath, "utf8");
  const frontmatter = extractSkillFrontmatter(content);
  if (!frontmatter) {
    fail(`${pluginName}: ${label} is missing YAML frontmatter`);
    return false;
  }

  const { name: skillName, description } = readFrontmatterValues(frontmatter.frontmatterLines);

  let isValid = true;
  if (skillName !== skillDirName) {
    fail(`${pluginName}: ${label} frontmatter name must match directory`);
    isValid = false;
  }
  if (!description) {
    fail(`${pluginName}: ${label} frontmatter description is required`);
    isValid = false;
  }
  if (!frontmatter.body.trim()) {
    fail(`${pluginName}: ${label} body is required`);
    isValid = false;
  }
  if (!validateAgentsOpenaiYaml(pluginName, skillsPath, skillDirName, dirname(skillPath), fail)) {
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
    .filter((entry) => !entry.name.startsWith("."))
    .filter((entry) => {
      const entryPath = join(skillsRoot, entry.name);
      if (entry.isSymbolicLink() && existsSync(entryPath) && statSync(entryPath).isDirectory()) {
        fail(
          `${pluginName}: skill directory symlink is not allowed at ${skillFileLabel(skillsPath, entry.name)}`
        );
      }
      return entry.isDirectory();
    })
    .map((entry) => entry.name)
    .sort();

  if (skillDirectories.length === 0) {
    fail(`${pluginName}: skills directory must contain at least one skill directory`);
  }

  let validSkillCount = 0;
  for (const skillDirName of skillDirectories) {
    const skillPath = join(skillsRoot, skillDirName, "SKILL.md");
    if (validateSkillFile(pluginName, skillsPath, skillDirName, skillPath, fail)) {
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
    validateDefaultPrompt(manifestPath, manifest, fail);

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
