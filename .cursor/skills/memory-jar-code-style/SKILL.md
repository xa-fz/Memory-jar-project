---
name: memory-jar-code-style
description: >-
  Coding standards for the Memory Jar monorepo: validation boundaries, when to
  extract shared helpers, minimal diffs, and avoiding redundant checks. Use when
  writing or reviewing code, refactoring, optimizing validation, or when the user
  asks about project conventions, code style, or 代码规范 in memory-jar /
  memory-jar-server.
---

# Memory Jar · 代码规范

本 Skill 约束**怎么写代码**；加新功能的步骤见 [memory-jar-add-api](../memory-jar-add-api/SKILL.md)。

## 核心原则

1. **最小改动**：只动任务相关文件，不顺手重构、不扩大 scope。
2. **信任上游**：边界层清洗/校验过后，内层直接使用，不重复判断。
3. **能内联就内联**：公共函数只在**真正通用**时提取，不为 DRY 而 DRY。
4. **匹配现有风格**：命名、分层、import、错误响应方式与周边文件一致。

---

## 校验：做一次，在边界

### 后端（API 入口）

字符串请求体在 **Pydantic schema** 统一处理：

- 工具：`app/schemas/validators.py` → `strip_required_text`
- 在 `field_validator` 里 strip + 非空
- `app/api/` 和 `app/core/` **不再**对同一字段做 `strip()` / `if not text`

```python
# ✅ schema 已校验
def create_conversation(db: Session, *, user_id: int, title: str) -> Conversation:
    conversation = Conversation(user_id=user_id, title=title)
    ...

# ❌ service 里重复
def create_conversation(..., title: str):
    title = title.strip()
    if not title:
        raise ValueError(...)
```

**保留**的合理判断（不是冗余）：

| 场景 | 示例 |
|------|------|
| 资源不存在 | `get_conversation` 返回 `None` → 404 |
| 外部依赖结果 | LLM 返回空、文件解析失败 |
| 鉴权 | token 缺失、用户不匹配 |
| DB 状态 | 向量化时 `doc.content` 为空 |
| 历史/非结构化数据 | `chat_service` 里清洗 message dict |

### 前端（提交边界）

- 按钮 `disabled`：`!value.trim()`
- 提交处：`const trimmed = value.trim(); if (!trimmed) return`
- **同一字段只在一层 trim**（通常在触发提交的组件），Context / API 封装层不再 trim

```typescript
// ✅ ConversationSidebarItem 提交时 trim，Context 直接传 title
const trimmed = renameValue.trim()
if (!trimmed) return
await onRename(trimmed)

// ❌ Sidebar trim 一次，ChatContext.renameConversation 再 trim 一次
```

后端已有 Pydantic 校验时，前端 trim 主要为 **UX（禁用按钮）**，不是安全边界。

---

## 公共函数：通用再提取

### 何时提取

| 提取 | 不提取 |
|------|--------|
| 3+ 处相同**非平凡**逻辑 | 1～2 处的 `value.trim()` |
| 跨模块契约（如所有 API 字符串校验） | 把 `!x.trim()` 包成 `hasText(x)` |
| 易错流程（SSE 解析、向量索引） | 单行 `if not conversation: return 404` |
| 已有文件里的领域函数（`get_conversation`） | 仅为少写 3 行新建的 `utils/text.ts` |

### 后端

- ✅ `strip_required_text`：所有 HTTP 入参的统一契约
- ✅ `get_conversation`、`message_to_dict`：领域复用
- ❌ 把 `if not doc: return error_response(...)` 抽成装饰器（仅为了减少重复行）
- ❌ service 里再包一层 `normalize_title(title)` 仅调用 `strip()`

### 前端

- ✅ `sortConversations`、`mapConversationSummary`：列表映射多处使用
- ✅ `httpGet` / `httpPost`：HTTP 基础设施
- ❌ `utils/text.ts` 包装 `trim()`（已回退；直接用原生 API）
- ❌ 与后端重复的 `buildConversationTitle`（后端 `conversation_service` 已有）

**判断口诀**：抽出来后是**更短更清晰**，还是**多一个文件要跳转**？后者则不抽。

---

## 注释与错误处理

- 代码应自解释；注释只写**非显而易见的业务或技术原因**（如流式响应需独立 DB session）。
- 不为极不可能的分支加层层 fallback。
- 不添加用户未要求的测试、文档、类型体操。

---

## Code Review 快速检查

```
- [ ] 同一字段是否在 schema / 提交组件 / service 重复 strip 或空判断？
- [ ] 新 util 是否有 ≥3 处真实调用且逻辑非平凡？
- [ ] diff 是否包含与任务无关的重构？
- [ ] 是否保留了资源缺失、鉴权、外部 API 等合理判断？
- [ ] 命名与 import 是否与同目录文件一致？
```

---

## 与本仓库其他 Skill 的关系

| Skill | 用途 |
|-------|------|
| **memory-jar-code-style**（本文件） | 怎么写、怎么审 |
| [memory-jar-add-api](../memory-jar-add-api/SKILL.md) | 加一个小功能走哪些文件 |

实现功能时：**两个都读**；纯答疑或读代码时，通常不需要。
