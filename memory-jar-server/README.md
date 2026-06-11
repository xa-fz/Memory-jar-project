# Memory Jar Server · 后端

> 你的私人记忆罐子 — 存入一切，随时召回

基于 **FastAPI + LangChain** 的 RAG 后端：文档管理、向量检索、智能问答、对话持久化。

---

## 工作区结构

```
Memory-jar-project/
├── jar-docs/             # 开发文档与共享资源
├── memory-jar/           # 前端
└── memory-jar-server/    # 本目录 · 后端
```

Monorepo：[Memory-jar-project](https://github.com/xa-fz/Memory-jar-project)

**开发文档**见 [`jar-docs/`](../jar-docs/)，本 README 只写后端仓库相关的内容。

| 文档 | 说明 |
|------|------|
| [jar-docs/README.md](../jar-docs/README.md) | 文档目录索引 |
| [jar-docs/dev.md](../jar-docs/dev.md) | 产品概述、功能范围、版本计划、数据库设计 |
| [docs/database.md](./docs/database.md) | SQLite 连接说明、DBeaver 使用、SQLite vs PostgreSQL |

---

## 环境要求

- Python >= 3.10
- [DeepSeek API Key](https://platform.deepseek.com/)

---

## 快速开始

### 1. 安装依赖

```bash
cd memory-jar-server
pip install -r requirements.txt
```

### 2. 配置环境变量

创建 `.env`：

```env
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

APP_HOST=0.0.0.0
APP_PORT=8000
DATABASE_URL=sqlite:///./data/memory_jar.db
VECTOR_STORE_PATH=./data/chroma
CORS_ORIGINS=http://localhost:5173
JWT_SECRET=memory-jar-dev-secret-change-me
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=1234
```

首次启动会自动创建 SQLite 表，并在无用户时创建默认账号（用户名/密码见上，可通过环境变量修改）。

### 3. 初始化并启动

```bash
mkdir -p data
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

| 地址 | 说明 |
|------|------|
| http://localhost:8000 | API 服务 |
| http://localhost:8000/docs | Swagger UI |
| http://localhost:8000/redoc | ReDoc |

### 4. 与前端联调

1. 后端运行在 `http://localhost:8000`
2. 前端 `VITE_API_BASE_URL=http://localhost:8000`
3. `CORS_ORIGINS` 包含前端地址（默认 `http://localhost:5173`）

---

## 技术栈

| 类别 | 技术 |
|------|------|
| Web | FastAPI |
| RAG | LangChain |
| 数据库 | SQLite |
| 向量库 | Chroma |
| LLM | DeepSeek API |
| ASGI | Uvicorn |

---

## 目录结构

```
memory-jar-server/
├── app/
│   ├── main.py             # FastAPI 入口
│   ├── api/                # 路由
│   ├── core/               # 配置、RAG
│   ├── db/                 # 数据库
│   └── services/           # 业务逻辑
├── data/                   # SQLite、向量库（gitignore）
├── requirements.txt
└── README.md
```

---

## API 接口

库表结构见 [jar-docs/dev.md](../jar-docs/dev.md)。

### 健康检查

```
GET /health
```

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录，写入 HttpOnly Cookie |
| POST | `/api/auth/logout` | 登出，清除 Cookie |
| GET | `/api/auth/me` | 当前用户信息（自动读 Cookie） |

登录成功后，JWT 写入 Cookie（`access_token`），后续请求浏览器会自动携带，无需手动传 Token。Swagger（`/docs`）在同域下登录后可直接调 `/me`。

**curl 示例**（用 cookie 文件模拟浏览器）：

```bash
curl -c cookies.txt -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"1234\"}"

curl -b cookies.txt "http://localhost:8000/api/auth/me"

curl -b cookies.txt -X POST "http://localhost:8000/api/auth/logout"
```

默认开发账号：`admin` / `1234`（可通过 `.env` 的 `DEFAULT_USERNAME`、`DEFAULT_PASSWORD` 修改，仅首次初始化、库中无用户时生效）。

### 文档

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/documents` | 列表（待实现） |
| POST | `/api/documents/upload/` | **上传文件**（`multipart/form-data`，字段 `file`） |
| GET | `/api/documents/{id}` | 详情（待实现） |
| DELETE | `/api/documents/{id}` | 删除（待实现） |

**上传文档**（无需 JSON body，只传文件）：

```bash
curl -X POST "http://localhost:8000/api/documents/upload/" \
  -F "file=@./notes.md"
```

- 自动以**文件名**作为 `title`，读取文件内容为 `content`
- 支持：`.txt` `.md` `.pdf` `.doc` `.docx` `.json` `.xml` `.csv` `.xlsx`

### 问答

```
POST /api/chat
Content-Type: application/json

{ "question": "你的问题" }
```

### 对话历史

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/conversations` | 列表 |
| GET | `/api/conversations/{id}` | 详情 |

---

## 后端职责（V1.0）

- [x] FastAPI 基础框架
- [x] CORS、健康检查
- [x] 文档上传 API（`POST /api/documents/upload/`）
- [x] 用户登录 / 登出 / 当前用户信息（JWT）
- [ ] 文档列表 / 详情 / 删除 API
- [ ] RAG 检索链路
- [ ] `/api/chat` 问答
- [ ] 对话持久化

完整版本规划见 [jar-docs/dev.md](../jar-docs/dev.md)。

---

## License

MIT License
