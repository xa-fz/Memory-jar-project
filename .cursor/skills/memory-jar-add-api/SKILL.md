---
name: memory-jar-add-api
description: >-
  Add a small full-stack feature to the Memory Jar monorepo (FastAPI backend +
  React frontend). Use when adding API endpoints, wiring frontend calls, or when
  the user asks how to extend memory-jar / memory-jar-server with a new feature.
---

# Memory Jar · 添加小功能（全栈）

从后端到前端打通一个**小功能**（示例：对话置顶 pin）。

写法与审查标准见 [memory-jar-code-style](../memory-jar-code-style/SKILL.md)。本文件只讲**加功能走哪些文件**。

## 仓库结构

```
yoursMemory/
├── memory-jar-server/   # FastAPI · 前缀 /api
└── memory-jar/          # React · 请求前缀 /mj（Vite 代理到后端 /api）
```

## 加功能时的路径约定

1. **分层落点**：`app/api/` 路由 → `app/core/` 业务 → `app/db/models.py` ORM。
2. **鉴权**：需登录接口加 `current_user: User = Depends(get_current_user)`。
3. **前端请求**：`@/components` 的 `httpGet` / `httpPost` / `httpPatch` / `httpDelete`；路径写 `/chat/...`（不写 `/api` 或 `/mj`）。

## 工作流清单

```
- [ ] 1. 明确接口：方法、路径、请求/响应字段
- [ ] 2. 后端 schema（如需 body）
- [ ] 3. 后端 core 函数（DB 操作）
- [ ] 4. 后端 api 路由 + 在 main.py 注册（新 router 时）
- [ ] 5. 前端 types（如需）
- [ ] 6. 前端调用 + UI
- [ ] 7. i18n（用户可见文案加到 zh-CN.ts / en-US.ts）
```

## 示例：对话置顶 `POST /api/chat/conversations/{id}/pin`

### 1. Schema

`app/schemas/conversations.py` 增加响应模型；有 body 时在此定义请求模型。

### 2. Core

`app/core/conversation_service.py`：

```python
def set_conversation_pinned(
    db: Session, *, user_id: int, conversation_id: int, pinned: bool
) -> Conversation | None:
    conversation = get_conversation(db, user_id=user_id, conversation_id=conversation_id)
    if not conversation:
        return None
    conversation.pinned = pinned  # 需先在 models 加字段
    db.commit()
    db.refresh(conversation)
    return conversation
```

### 3. API

`app/api/chat.py`：

```python
@router.post("/conversations/{conversation_id}/pin")
def pin_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = set_conversation_pinned(
        db, user_id=current_user.id, conversation_id=conversation_id, pinned=True
    )
    if not conversation:
        return error_response(message="Conversation not found", code=404)
    return success_response(data=conversation_to_list_item(conversation))
```

### 4. 前端

`ChatContext.tsx` 增加方法，内部：

```typescript
const body = await httpPost(`/chat/conversations/${id}/pin`)
if (body.code !== 200 || !body.data) return false
// 更新 conversations 列表状态
```

侧边栏 `ConversationSidebarItem` 菜单里加「置顶」按钮，文案走 `intl.formatMessage`。

### 5. 验证

```bash
# 后端
cd memory-jar-server
.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 前端
cd memory-jar
npm run dev
```

## 何时不要套本 Skill

- 纯答疑、读代码 → 不必读此文件
- Code Review、校验优化、抽公共函数 → 读 [memory-jar-code-style](../memory-jar-code-style/SKILL.md)
- 流式 SSE、文档向量化等复杂模块 → 先读对应 `app/core/*.py` 再改
