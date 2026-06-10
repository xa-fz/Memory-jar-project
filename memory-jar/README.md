# Memory Jar · 前端

> 你的私人记忆罐子 — 存入一切，随时召回

React 聊天界面与文档管理，对接同级目录 `memory-jar-server` 的 RAG API。

Monorepo：[Memory-jar-project](https://github.com/xa-fz/Memory-jar-project)

---

## 工作区结构

```
Memory-jar-project/
├── jar-docs/             # 开发文档与共享资源
├── memory-jar/           # 本目录 · 前端
└── memory-jar-server/    # 后端
```

**开发文档**见 [`jar-docs/`](../jar-docs/)，本 README 只写前端仓库相关的内容。

| 文档 | 说明 |
|------|------|
| [jar-docs/README.md](../jar-docs/README.md) | 文档目录索引 |
| [jar-docs/dev.md](../jar-docs/dev.md) | 产品概述、功能范围、版本计划、数据库设计 |

---

## 快速开始

### 环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | **22.22.0** | 最低：^20.19.0 \|\| >=22.12.0；`nvm use 22.22.0` |
| npm | >= 8.0.0 | 包管理器 |
| 后端 | - | 需先启动 `memory-jar-server` |

### 配置

创建 `.env.local`：

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 命令

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
npm run lint
```

### 联调

1. 启动后端：`http://localhost:8000`
2. 确认 `VITE_API_BASE_URL` 指向后端
3. 接口定义以后端实现与 [jar-docs/dev.md](../jar-docs/dev.md) 为准

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 |
| UI | Mantine v7 + @mantine/dropzone + Tabler Icons |
| 语言 | TypeScript |
| 构建 | Vite 8 |

---

## 目录结构

```
src/
├── components/       # 每组件一文件夹，见 components/README.md
├── data/mock.ts      # 模拟数据（当前未接 API）
├── layouts/          # AppLayout（AppShell + 侧栏）
├── pages/            # ChatPage、DocumentsPage、HistoryPage
├── types/            # 类型定义
├── App.tsx           # 页面路由
├── main.tsx
└── index.css
```

---

## 前端职责（V1.0）

- [x] 聊天界面 UI（模拟回答，待接 `/api/chat`）
- [x] 文档管理 UI：Dropzone 上传、列表、删除（本地模拟，待接 `/api/documents/upload/`）
- [x] 对话历史列表 UI（静态 mock 数据）
- [ ] 与后端 API 联调

完整版本规划见 [jar-docs/dev.md](../jar-docs/dev.md)。

---

## 数据与接口（摘要）

与后端约定的实体字段见 [jar-docs/dev.md](../jar-docs/dev.md)：

- **Document**：`id`, `title`, `content`, `created_at`
- **Conversation**：`id`, `question`, `answer`, `sources`, `created_at`

主要接口（路径以后端为准，详见 [memory-jar-server README](../memory-jar-server/README.md#api-接口)）：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/documents` | 文档列表 |
| POST | `/api/documents/upload/` | 上传文档（`FormData`，字段 `file`，无需填标题/内容） |
| DELETE | `/api/documents/{id}` | 删除文档 |
| POST | `/api/chat` | 问答 |
| GET | `/api/conversations` | 对话历史 |

**上传示例**（前端实现参考）：

```ts
const formData = new FormData();
formData.append('file', file); // file 来自 <input type="file" />

await fetch(`${API_BASE}/api/documents/upload/`, {
  method: 'POST',
  body: formData,
});
```

文档页 UI：**选择文件 / 拖拽上传**即可，不要标题、内容表单；`title` 由后端从文件名解析。

---

## License

MIT License
