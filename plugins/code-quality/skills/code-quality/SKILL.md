---
name: code-quality
description: 审查代码变更，识别质量风险，并在各类通用软件项目中指导有针对性的清理。
---

# Code Quality

当用户请求代码 review、质量审计、bug 风险扫描、测试质量审查、重构建议，或清理可避免的
防御性代码时，使用本 skill。

## Operations

本 skill 支持两种显式操作：

1. `review <pr-id|commit-id|commit-range|description>` - 审查代码变更并写出 review
   产物。
2. `cleanup` - 当用户要求修改代码时，发现并清理一小类特定的质量问题。

如果用户没有指明操作，从其请求推断可能的操作。审计/审查请求使用 `review`，仅当用户
要求修改代码时才使用 `cleanup`。

## First Principles

- 先阅读仓库自身的指引：`AGENTS.md`、`CLAUDE.md`、`CONTRIBUTING.md`、README
  文件、项目文档、package scripts、lint/type/test 配置，以及附近的测试。
- 当本地项目约定明确时，将其视为事实来源。
- 在检查仓库之前，不要假设框架、语言、测试运行器、包管理器或服务布局。
- 具体的发现优先于宽泛的风格评论。
- 做 review 时，优先报告 bug、回归、安全问题和缺失的测试。
- 做 cleanup 时，进行保持行为的小改动，并用项目中可用的最窄的可靠命令集进行验证。

## Project Documentation Discovery

在审查代码之前，先寻找项目自有的质量规则和测试策略文档。用 `rg --files` 搜索常见位置，
并在套用通用启发式之前阅读相关文件。

优先查找名称或路径中包含以下内容的文件：

- `AGENTS.md`、`CLAUDE.md`、`CONTRIBUTING.md`、`DEVELOPMENT.md`、`README.md`
- `docs/`、`.github/`、`guides/`、`architecture/`、`adr/`
- `quality`、`code-quality`、`bad-smell`、`testing`、`test`、`lint`、`typecheck`、`style`
- 特定框架的测试文档，如 `api-testing`、`cli-testing`、`app-testing` 或
  `e2e-testing`

从文档中提取这些事实：

- 必需的验证命令以及必须在哪里运行它们。
- Commit、PR、语言和 review 约定。
- 测试策略：单元 vs 集成 vs E2E、mock 边界、fixture 准备、清理，以及
  特定框架的辅助工具。
- 代码质量规则：类型严格度、lint 豁免、错误处理、配置、依赖加载、公开 API 预期，
  以及安全要求。
- 不应作为新发现对待的已知例外或技术债。

如果项目没有明确的文档，说明这一点，并继续使用下面的通用清单。

## Default Baseline Bad Smells

当仓库没有明确规则，或本地文档未覆盖某个方面时，使用这些默认值。如果本地项目指引与本
清单冲突，遵循本地指引，并在对 review 有影响时提及该冲突。

### Type Safety

- 无正当理由的 `any`、不安全的类型转换、宽泛的类型断言，或被擦除的泛型。
- 未经类型收窄就使用的 `unknown` 值。
- 缺少明确类型的公开函数、API 响应或序列化数据。

### Suppressed Diagnostics

- 没有狭小且有据可查的理由的 `eslint-disable`、`@ts-ignore`、`@ts-nocheck`、
  `@ts-expect-error`、格式化工具忽略或等价豁免注释。
- 通过削弱 lint、类型检查、测试或 CI 的配置来绕过问题，而不是修复底层问题。

### Mocking Boundaries

- 当公开入口可以执行真实行为时，却 mock 内部模块、相对导入、数据库层、文件系统层或
  核心业务服务的测试。
- 只断言 mock 调用，而不是用户可见、API 可见、CLI 可见或已持久化行为的测试。
- 当项目已有网络级 mock 模式（如 MSW、VCR 或本地假服务）时，直接 mock HTTP/fetch。

### Test Realism And Stability

- 当同样的行为可以通过公开入口覆盖时，却为私有/内部函数编写单元测试。
- 为了让测试通过而使用假定时器、任意 sleep、增大超时、轮询循环或人为延迟。
- 隐藏了项目本可以用隔离的真实资源测试的行为的文件系统、数据库、队列、缓存或时钟 mock。
- 验证框架/库行为而不是项目行为的测试。
- 对 bug 修复、迁移、授权变更、解析变更或跨边界工作流缺失回归测试。

### Error Handling And Fallbacks

- 只记录日志并重抛、返回通用 fallback、静默返回 `null`/`undefined` 或隐藏原始错误的
  catch 块。
- 掩盖部署/配置错误的 fallback 配置、默认密钥、fallback URL、宽松重试或恢复分支。
- 没有限制、退避、取消、幂等性或可见性的重试。
- 被吞掉的 promise rejection，以及没有归属或失败报告的发射后不管式工作。

### Configuration And Dependency Loading

- 硬编码的环境相关 URL、凭据、路径、功能开关、模型名或服务端点。
- 没有真实边界（如可选依赖支持、代码分割或 plugin 加载）的动态导入或惰性依赖加载。
- 散布在业务逻辑中、而非集中校验的运行时配置读取。

### API, Data, And Security

- 没有兼容性处理、迁移说明或测试的公开 API 契约变更。
- 新的读/写路径上缺失的授权、租户、归属或权限检查。
- 出现在日志、错误、遥测、快照、测试 fixture 或生成产物中的敏感数据。
- 非幂等写入、部分失败路径、迁移漂移或清理缺口。
- 注入、路径穿越、SSRF、不安全的反序列化、命令构造或不安全的文件访问。

### Maintainability And Design

- 过早抽象、宽泛的辅助函数、重复的业务规则、死代码，以及没有当前调用方的选项。
- 为了支持假想场景而让常用路径更难理解的改动。
- 混合行为变更、格式化、重命名和重构的大而杂的 commit。
- 在标准库、已有本地辅助函数或更小范围的改动即可满足需求时引入新依赖。

## Review Workflow

1. 从用户请求确定 scope：
   - Pull request 编号：可用时用 `gh pr view` 查看 PR 元数据和 commit。
   - Commit 区间：使用 `git rev-list`、`git diff` 和 `git show`。
   - 单个 commit：检查该 commit 及其受影响的测试。
   - 工作树：检查 `git status`、已暂存变更和未暂存变更。
   - 路径或功能描述：用 `rg` 搜索并检查相关模块。
2. 确定验证面：
   - 构建、lint、类型检查、单元测试、集成测试和有针对性的冒烟检查。
   - 优先使用仓库文档中记载的命令，而不是猜测的命令。
3. 根据上面发现的项目文档构建项目专属的 review 评分标准。
4. 当 review 跨多个 commit 或 PR 时创建 review 产物：
   - 阅读并遵循
     [repository work-file contract](../../references/repository-work-files.md)。
   - 使用当前本地日期和该约定中的 scope 命名规则创建
     `<codex-work>/reviews/YYYYMMDD/<review-scope>/`。
   - 在 scope 目录中创建 `commit-list.md`。
   - 为每个被审查的 commit 在那里创建一个 `review-{short-hash}.md` 文件。
   - 对于工作树或纯路径 review，当持久化报告有用时，在那里创建 `review-working-tree.md`。
5. 审查变更的行为，而不只是变更的行：
   - 追踪调用方和公开入口。
   - 检查数据校验、错误传播、并发、IO、授权和状态变更。
   - 检查测试是否对行为和失败模式有实质性覆盖。
6. 按评分标准分类跟踪问题数量，让摘要展示风险的形态，而不只是一份发现清单。
7. 按严重度排序报告发现：
   - `P0`：正确性、数据丢失、安全，或阻断发布的回归。
   - `P1`：可能用户可见的 bug、损坏的工作流，或重要的缺失测试。
   - `P2`：可维护性风险、脆弱的测试、不清晰的 API，或后续清理。
8. 尽可能包含文件和行引用。
9. 如果没有发现，明确说明，并指出遗留的测试缺口或未验证的区域。

## Review Artifact Format

`commit-list.md` 使用以下结构：

```markdown
# Code Review: YYYYMMDD

## Scope

- Input: `<original review scope>`
- Repository: `<repo>`
- Base/head or commits: `<range>`

## Review Rubric

- Project docs read: `<list>`
- Verification commands identified: `<list>`
- Key local conventions: `<summary>`

## Commits

- [ ] [`short-hash`](./review-short-hash.md) Commit subject

## Review Summary

**Total Commits Reviewed:** 0

### Findings By Severity

- P0: 0
- P1: 0
- P2: 0

### Quality Statistics

- Correctness: 0
- Tests: 0
- Mock boundaries: 0
- Error handling: 0
- Security/privacy: 0
- Data/migrations: 0
- Performance: 0
- Maintainability: 0

### Action Items

- [ ] ...
```

每个 `review-{short-hash}.md` 使用以下结构：

````markdown
# Code Review: short-hash

## Commit Information

- Hash: `full-hash`
- Subject: `subject`
- Author: `name <email>`
- Date: `date`

## Changes Summary

```text
git show --stat output
```

## Findings

### P1: Short issue title

- Location: `path/file.ext:42`
- Category: Tests
- Impact: Explain the concrete failing scenario.
- Recommendation: Describe the smallest credible fix.

## Category Notes

- Correctness: ...
- Tests: ...
- Mock boundaries: ...
- Error handling: ...
- Security/privacy: ...
- Data/migrations: ...
- Performance: ...
- Maintainability: ...

## Verification

- Ran: `...`
- Not run: `...`
````

review 结束后，更新 `commit-list.md`：勾选每个 commit 的复选框、链接指向 review
文件、严重度合计准确、质量统计计入具体发现。避免虚高计数：即使某个根因问题出现在相邻的
多行中，也只计一次。

## Review Commands

用于收集 review 上下文的有用命令：

- PR commits：`gh pr view <pr-id> --json commits --jq '.commits[].oid'`
- Commit 区间：`git rev-list <range> --reverse`
- 单个 commit 元数据：`git show --stat <commit>`
- Commit patch：`git show <commit>`
- 工作树：`git status --short`、`git diff` 和 `git diff --cached`
- 仅描述式 review 的近期 commit：`git log --since="1 week ago" --pretty=format:"%H"`

如果仓库文档记载了更好的工作流，不要把这些命令视为必须使用。

## Quality Checklist

检查 scope 内变更的相关项：

- 正确性：边界情况、null/空输入、错误路径、重试、顺序、时区和向后兼容。
- API 与接口设计：破坏性变更、易混淆的命名、漏抽象，以及未记录的契约变更。
- 测试：有意义的断言、对公开行为的集成覆盖、不稳定的时序、过度 mock、测试隔离，
  以及缺失的回归测试。
- Mock 边界：优先 mock 外部服务而非内部实现；检查项目是否记载了例外。
- 测试真实性：避免只断言 mock 调用、实现细节或库行为的测试，除非项目明确要求这种覆盖。
- IO 测试：当项目支持时，优先使用受控 fixture 的真实文件系统、数据库和 HTTP 边界；
  否则遵循本地测试基础设施。
- 时间与异步：除非本地文档规定安全模式，否则避免人为 sleep、宽泛的假定时器、
  悬空 promise 和易竞态的清理。
- 错误处理：被吞掉的错误、通用 fallback、记日志即返回的模式、无限制的重试循环，
  以及无法有效恢复的 catch 块。
- 安全与隐私：注入、授权检查、密钥处理、不安全的文件系统访问、SSRF、路径穿越，
  以及敏感信息日志。
- 数据与迁移：幂等性、回滚行为、默认值、schema 漂移和部分失败。
- 性能：可避免的 N+1 工作、无界循环、不必要的网络调用、阻塞 IO 和内存增长。
- 可维护性：重复逻辑、未使用的抽象、过于宽泛的辅助函数、混乱的控制流、类型逃逸、
  没有明确必要的动态导入、硬编码配置，以及被豁免的诊断。

## Cleanup Workflow

仅当用户要求修改代码时才使用此模式。

1. 找到窄小的清理目标，例如可避免的防御性 `try`/`catch` 块、重复分支、未使用的抽象、
   过期的豁免或脆弱的测试准备代码。
2. 确认每个改动是保持行为的，还是有意改变行为的。
3. 优先删除不必要的代码，而不是添加替代抽象。
4. 保持 commit 聚焦，并使用 Conventional Commit 消息。
5. 在报告完成前运行最相关的验证命令。

对于防御性错误处理清理，仅在以下条件全部满足时才移除 catch 块：

- catch 块只记录日志并重抛、返回通用 fallback，或静默返回 `null`/`undefined`。
- 没有必需的清理、回滚、重试、审计或领域错误转换。
- 调用方或框架有更清晰的错误边界。
- 该改动不会隐藏面向用户的错误消息要求。

不要移除执行有意义恢复、资源清理、逐项隔离、安全审计或特定领域错误转换的 catch 块。

## Output

对于 review 任务，使用以下结构：

```markdown
Findings:
- P1 `path/file.ext:42` Short issue title.
  Explain impact and the concrete failing scenario.
  Suggested fix: ...

Open questions:
- ...

Verification:
- Ran `...`
- Not run: ...
```

对于 cleanup 任务，总结：

- 变更的文件。
- 行为是保持不变还是有意改变。
- 运行的验证。
- 遗留风险或后续工作。

## Source Inspiration

本工作流概括自常见仓库质量实践，以及公开 vm0 项目文档中关于坏味道和测试策略的内容。
除非正在审查 vm0 仓库本身，否则不要假设 vm0 特有的路径、命令或规则。
