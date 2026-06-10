# Memory Jar Project

> 你的私人记忆罐子 — 存入一切，随时召回

Monorepo：前端 UI、后端 API、产品与设计文档统一管理。

**远程仓库**：[github.com/xa-fz/Memory-jar-project](https://github.com/xa-fz/Memory-jar-project)

---

## 目录结构

```
Memory-jar-project/
├── memory-jar/           # 前端 · React 19 + Mantine v7 + Vite
├── memory-jar-server/    # 后端 · FastAPI + LangChain + RAG
├── jar-docs/             # 开发文档、设计图、共享资源
└── README.md             # 本文件
```

| 目录 | 说明 | 详细文档 |
|------|------|----------|
| `memory-jar/` | 聊天、文档上传、历史记录 UI | [memory-jar/README.md](./memory-jar/README.md) |
| `memory-jar-server/` | 文档上传 API、问答、向量检索 | [memory-jar-server/README.md](./memory-jar-server/README.md) |
| `jar-docs/` | 产品需求、数据库设计、Figma 设计图 | [jar-docs/README.md](./jar-docs/README.md) |

---

## 快速开始

### 1. 克隆

```bash
git clone https://github.com/xa-fz/Memory-jar-project.git
cd Memory-jar-project
```

### 2. 启动后端

```bash
cd memory-jar-server
pip install -r requirements.txt
# 配置 .env 后
uvicorn app.main:app --reload --port 8000
```

### 3. 启动前端

```bash
cd memory-jar
npm install
npm run dev
```

前端默认 `http://localhost:5173`，后端 `http://localhost:8000`。

---

## 产品说明

完整需求与 API 约定见 [jar-docs/dev.md](./jar-docs/dev.md)。

设计原型见 [jar-docs/assets/](./jar-docs/assets/)。

---

## License

MIT License
