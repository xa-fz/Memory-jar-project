# RAG 向量存储

## 方案：SQLite 向量表

向量存在 `memory_jar.db` 的 `document_chunks` 表中，每条记录包含文档分块文本与 embedding（JSON）。检索时对当前用户的分块做**余弦相似度**排序，取 Top-K。

特点：

- 与业务库同文件，部署简单
- 不依赖 Chroma 等外部向量服务
- 个人知识库规模足够
- 使用本地 `sentence-transformers` 生成向量（需按 README 安装 **torch 2.5.1 CPU**）

## 使用方式

1. 上传文档（不会自动向量化）
2. 在文档列表点击向量化图标，或调用 `POST /api/documents/{id}/vectorize`
3. 在对话页提问，后端从已向量化文档中检索相关片段

## 相关配置

```env
EMBEDDING_MODEL=all-MiniLM-L6-v2
RAG_CHUNK_SIZE=600
RAG_CHUNK_OVERLAP=80
RAG_TOP_K=4
```
