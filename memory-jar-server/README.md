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
- [Deep Seek API Key](https://platform.deepseek.com/)（智能摘要 / 后续 Chat 需要，可选）

---

## 快速开始

完整步骤见 **[开发环境](#开发环境)**。已配置好环境时，每次开发只需：

```bash
cd memory-jar-server
.venv\Scripts\activate          # Windows；Linux/macOS: source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 开发环境

日常本地开发按以下步骤（支持热重载 `--reload`）。

### 1. 创建虚拟环境并安装依赖

**Windows（PowerShell / CMD）**

```bash
cd memory-jar-server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

**Linux / macOS**

```bash
cd memory-jar-server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

未激活虚拟环境时，也可直接启动（Windows 示例）：

```bash
.venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 配置环境变量

在 `memory-jar-server` 目录创建 `.env`：

```env
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEKMODEL=deepseek-chat

APP_HOST=0.0.0.0
APP_PORT=8000
DATABASE_URL=sqlite:///./data/memory_jar.db
CORS_ORIGINS=http://localhost:5173
JWT_SECRET=memory-jar-dev-change-me
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=P@ssw0rd
```

说明：

- 首次启动会自动建 SQLite 表；库中无用户时创建默认账号 `admin` / `P@ssw0rd`（仅初始化一次）。
- `data/uploads/`、`data/memory_jar.db` 会在运行时自动创建。
- 未配置 `DEEPSEEK_API_KEY` 时，文档上传与预览仍可用，**智能摘要**会跳过。

### 3. 启动开发服务器

在 `memory-jar-server` 目录、且已激活虚拟环境：

```bash
mkdir -p data
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Windows 若无 `mkdir -p`，执行 `mkdir data` 即可。

| 地址 | 说明 |
|------|------|
| http://localhost:8000 | API 根路径 |
| http://localhost:8000/health | 健康检查 |
| http://localhost:8000/docs | Swagger UI |
| http://localhost:8000/redoc | ReDoc |

修改 `app/` 下代码后，Uvicorn 会在 `--reload` 下自动重启。

### 4. 与前端联调

1. 保持后端运行在 `http://localhost:8000`
2. 另开终端启动前端：

   ```bash
   cd memory-jar
   npm install
   npm run dev
   ```

3. 浏览器打开 http://localhost:5173
4. 前端 Vite 已将 `/mj/*` 代理到 `http://localhost:8000/api/*`，开发时一般无需额外配置
5. 确认 `.env` 中 `CORS_ORIGINS` 包含 `http://localhost:5173`

### 5. 常用开发命令

```bash
# 健康检查
curl http://localhost:8000/health

# 登录（Cookie 写入 cookies.txt）
curl -c cookies.txt -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"P@ssw0rd\"}"
```

---

## 技术栈

| 类别 | 技术 |
|------|------|
| Web | FastAPI |
| RAG | LangChain |
| 数据库 | SQLite |
| 向量库 | Chroma |
| LLM | Deep Seek API |
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
  -d "{\"username\":\"admin\",\"password\":\"P@ssw0rd\"}"

curl -b cookies.txt "http://localhost:8000/api/auth/me"

curl -b cookies.txt -X POST "http://localhost:8000/api/auth/logout"
```

默认开发账号：`admin` / `P@ssw0rd`（可通过 `.env` 的 `DEFAULT_USERNAME`、`DEFAULT_PASSWORD` 修改，仅首次初始化、库中无用户时生效）。

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
