# 仓库指南

## 项目结构与模块组织

本仓库是一个 Codex plugin marketplace。Marketplace 元数据位于
`.agents/plugins/marketplace.json`。可安装的 plugin 位于 `plugins/<plugin-name>/` 下，
每个 plugin 必须包含 `plugins/<plugin-name>/.codex-plugin/plugin.json`。Plugin 的
skill 应放在 `plugins/<plugin-name>/skills/<skill-name>/SKILL.md`。JSON Schema 位于
`schemas/`。校验工具位于 `scripts/`，目前是 `scripts/validate-marketplace.mjs` 和
`scripts/validate-marketplace.test.mjs`。

## 构建、测试与开发命令

- `npm run validate` - 校验 marketplace 条目、plugin 清单、plugin 路径和 skill 文件。
- `npm test` - 先运行校验器的回归测试，再运行 marketplace 校验。
- `python3 /Users/liangyou/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/<plugin-name>` - 按 Codex plugin 清单规则校验单个 plugin。

在创建或更新 pull request 之前先运行校验。

## 代码风格与命名约定

Marketplace 和 plugin 清单使用 JSON，采用两空格缩进。Plugin 名称应使用小写 kebab-case，
例如 `code-quality` 或 `github-tools`。路径保持相对路径，并在 Codex 期望相对路径处使用
`./` 前缀，例如 `./plugins/code-quality` 和 `./skills/`。Markdown 文件应简洁，用清晰的
标题组织结构，并使用英文撰写。

## 测试指南

目前还没有应用运行时测试套件。把校验当作必需的测试面：用 `npm test` 覆盖校验器回归测试和
marketplace 校验。当改动需要满足更严格的 plugin-creator 契约时，还要为每个被改动的
plugin 运行 `validate_plugin.py`。编辑 skill 时，按渲染后的 Markdown 阅读，检查损坏的
代码围栏、过时的路径，以及不应全局适用的项目特定假设。

## Commit 与 Pull Request 指南

使用 Conventional Commits，与现有历史保持一致：
`feat: add code quality plugin (#2)`。描述优先使用小写，结尾不加句号。Pull request
应说明 plugin 或 marketplace 的行为发生了什么变化，列出运行过的校验命令；当 plugin 改编自
其他项目时，附上相关源材料的链接。

## Agent 专属说明

在未检查 plugin 清单和 marketplace 条目之前，不要覆盖已有 plugin。保留无关的用户改动。
避免使用 `git commit --amend` 和普通的 `git push --force`。把 feature 或 PR branch
rebase 到最新的默认分支，并用 `git push --force-with-lease` 更新同一远端 branch，无需
单独批准。其他历史重写或强制推送前请先询问。
