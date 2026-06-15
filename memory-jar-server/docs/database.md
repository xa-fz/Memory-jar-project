# Memory Jar · 数据库说明

本文档说明后端如何连接数据库、数据文件在哪、如何用 DBeaver 可视化查询，以及 SQLite 与 PostgreSQL 的选型建议。

---

## 1. 当前项目里数据存哪

| 数据 | 存储位置 | 持久化 | 说明 |
|------|----------|--------|------|
| 用户（登录） | SQLite `data/memory_jar.db` | ✅ | 表 `users` |
| 上传文档 | SQLite `documents` 表 | ✅ | 文本内容 + 元数据，按用户隔离 |
| 对话历史 | 未实现 | — | 规划表 `conversations` |
| 向量索引 | SQLite 表 `document_chunks`（同 `memory_jar.db`） | ✅ | RAG 检索 |
| 登出 token 黑名单 | 进程内存 | ❌ | 重启后失效 |

**默认 SQLite 文件路径**（在 `memory-jar-server` 目录下启动服务时）：

```
memory-jar-server/data/memory_jar.db
```

Windows 完整路径示例：

```
F:\fz\yoursMemory\memory-jar-server\data\memory_jar.db
```

该目录与 `*.db` 已在 `.gitignore` 中，不会提交到 Git。

---

## 2. 代码里 SQLite 如何连接

### 2.1 连接字符串

在 `.env` 或默认配置中：

```env
DATABASE_URL=sqlite:///./data/memory_jar.db
```

对应代码 `app/core/config.py`：

- `sqlite:///` + 相对路径 → 本地文件数据库
- 三个斜杠 `///` 表示「文件路径」，不是网络 host

若改为绝对路径（Windows 示例）：

```env
DATABASE_URL=sqlite:///F:/fz/yoursMemory/memory-jar-server/data/memory_jar.db
```

### 2.2 创建引擎与会话

`app/db/database.py` 核心逻辑：

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},  # SQLite + FastAPI 多线程需要
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

| 概念 | 作用 | 类比（Java） |
|------|------|----------------|
| `create_engine` | 连接池 / 引擎 | DataSource |
| `SessionLocal` | 一次请求用的会话 | EntityManager / Connection |
| `get_db()` | 接口注入，用完关闭 | `@Transactional` 里拿 Connection |

### 2.3 接口里如何使用

```python
@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    ...
```

- `Depends(get_db)`：每个 HTTP 请求分配一个 `db`
- 请求结束自动 `close()`，避免连接泄漏

### 2.4 表何时创建

服务启动时 `app/db/init_db.py` 执行：

```python
Base.metadata.create_all(bind=engine)
```

根据 `app/db/models.py` 中的模型（如 `User`）自动建表；若库中尚无用户，会创建默认开发账号（见 `.env` 中 `DEFAULT_USERNAME` / `DEFAULT_PASSWORD`）。

---

## 3. 用 DBeaver 连接 SQLite

DBeaver 可以连接本项目，**推荐用于开发时查看、调试 SQL**。

### 3.1 前置条件

1. 至少**启动过一次后端**，确保已生成 `data/memory_jar.db`
2. 已安装 DBeaver（Community 版即可）

### 3.2 新建连接

1. 打开 DBeaver
2. 菜单 **数据库** → **新建数据库连接**
3. 选择 **SQLite** → **下一步**
4. **Path** 点击浏览，选中：

   ```
   .../memory-jar-server/data/memory_jar.db
   ```

5. 若提示下载 SQLite 驱动，点击 **下载**
6. **测试连接** → 应显示「Connected」
7. **完成**

### 3.3 常用查询

```sql
-- 查看所有用户（密码列为 bcrypt 哈希，非明文）
SELECT id, username, password_hash, created_at FROM users;

-- 按用户名查
SELECT * FROM users WHERE username = 'admin';
```

在左侧导航展开：**数据库** → **memory_jar.db** → **表** → **users** → 右键 **查看数据**。

### 3.4 使用注意

| 注意点 | 说明 |
|--------|------|
| 与后端同时打开 | 一般可同时读；在 DBeaver 里大量写入时，后端可能遇到 `database is locked` |
| 不要改 `password_hash` | 登录校验依赖 bcrypt，随意改会导致无法登录 |
| 开发环境可改 | 删用户、改用户名等仅建议在本地调试时做 |
| 生产环境 | 慎用 GUI 直接改库，优先走 API 或迁移脚本 |

---

## 4. SQLite 与 PostgreSQL 区别

| 维度 | SQLite | PostgreSQL |
|------|--------|------------|
| **形态** | 单个 `.db` 文件，嵌入式 | 独立数据库服务（进程） |
| **安装** | 无需安装，Python 自带驱动 | 需安装服务或使用云托管（Neon、Supabase 等） |
| **连接方式** | 文件路径 | `host:port` + 用户名 + 密码 + 库名 |
| **并发写入** | 较弱，适合读多写少 | 强，适合多用户并发 |
| **部署** | 拷文件即备份 | 需 dump/备份策略 |
| **DBeaver** | 选 SQLite，指向 `.db` 文件 | 选 PostgreSQL，填主机与账号 |
| **项目改法** | `DATABASE_URL=sqlite:///./data/memory_jar.db` | `DATABASE_URL=postgresql+psycopg://user:pass@host:5432/dbname` |
| **适用场景** | 个人本地、单机、原型、小流量 | 生产、多用户、远程、需要复杂 SQL/扩展 |

**相同点**：项目里都用 **SQLAlchemy**，换库主要是改 `DATABASE_URL` 和安装对应驱动（如 `psycopg[binary]`），业务代码（Model、Query）大部分可复用。

---

## 5. 选型建议（Memory Jar 个人项目）

### 现阶段推荐：**继续用 SQLite**

理由：

1. **个人记忆罐**、本地/单机使用，访问量小，SQLite 足够
2. **零运维**：不用装 PostgreSQL、不用管端口和用户权限
3. **备份简单**：复制 `memory_jar.db` 即可
4. **与 DBeaver 配合好**：直接打开文件就能查
5. 项目仍在早期，文档、对话等还要迁入数据库，先用 SQLite 迭代更快

### 何时考虑换成 PostgreSQL

出现以下需求时再换不迟：

- 后端部署到云服务器，数据库也想放云上
- 多台设备 / 多人共用同一套数据
- 并发写入明显增多
- 想用云厂商免费档（Neon、Supabase 等）做「和个人项目绑定的远程库」
- 需要 PostgreSQL 特有功能（复杂 JSON 查询、全文检索扩展等）

### 迁移路径（以后若换 PG）

1. 在 `.env` 修改：

   ```env
   DATABASE_URL=postgresql+psycopg://用户名:密码@主机:5432/库名
   ```

2. 安装驱动：`pip install psycopg[binary]`

3. 表结构仍由 SQLAlchemy `create_all` 或迁移工具（Alembic）管理

4. DBeaver 新建 **PostgreSQL** 连接，填主机、库名、账号即可查询

**结论**：不是「必须用 PostgreSQL 才完整」——对个人开发而言，**SQLite + DBeaver 已经是完整、可用的组合**；PostgreSQL 是规模变大或上云时的升级选项，不是现在的必选项。

---

## 6. 环境变量速查

```env
# SQLite（默认，个人开发推荐）
DATABASE_URL=sqlite:///./data/memory_jar.db

# PostgreSQL 示例（将来若切换）
# DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/memory_jar
```

相关文件：

| 文件 | 说明 |
|------|------|
| `app/core/config.py` | 读取 `DATABASE_URL` |
| `app/db/database.py` | 引擎与会话 |
| `app/db/models.py` | 表模型 |
| `app/db/init_db.py` | 启动建表、默认用户 |
| `data/memory_jar.db` | SQLite 数据文件（运行时生成） |

---

## 7. 常见问题

**Q：DBeaver 找不到文件？**  
先在后端目录执行一次启动，或手动 `mkdir data` 后访问 `/health` 触发 `init_db`。

**Q：连接测试失败？**  
确认路径指向的是 `memory_jar.db` 而不是空目录；路径中尽量不含中文（若有问题可改用绝对路径）。

**Q：和 MySQL 比呢？**  
MySQL 与 PostgreSQL 类似，都是独立服务；本项目文档以 SQLite / PostgreSQL 为主，若用 MySQL 需改 `DATABASE_URL` 为 `mysql+pymysql://...` 并安装 `pymysql`。
