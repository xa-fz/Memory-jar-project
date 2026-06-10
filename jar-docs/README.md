# Memory Jar 文档与资源

本目录存放 Memory Jar 项目的**开发文档**与**共享资源**，monorepo 内前后端（`memory-jar`、`memory-jar-server`）均以此为准。

远程仓库：[Memory-jar-project](https://github.com/xa-fz/Memory-jar-project)

## 目录说明

| 路径 | 说明 |
|------|------|
| [dev.md](./dev.md) | 产品概述、功能范围、技术栈、数据库设计 |
| `assets/` | 图片、示意图、导出模板等静态资源（按需添加） |

## 使用约定

- **本目录**：产品说明、功能范围、版本计划、数据库设计、共享资源。
- **各仓库 README**：仅写该仓库的环境、命令、目录结构、API 实现与联调步骤。
- 新增资源文件放入 `assets/`，文档内用相对路径引用（如 `assets/架构图.png`）。

## 工作区结构

```
Memory-jar-project/
├── jar-docs/             # 本目录
├── memory-jar/           # 前端
└── memory-jar-server/    # 后端
```
