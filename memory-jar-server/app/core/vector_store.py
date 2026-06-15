from __future__ import annotations

import json
import math
from typing import Any

from sqlalchemy import Column, Integer, String, Table, Text, delete, select

from app.core.chunking import chunk_text
from app.core.config import settings
from app.core.embeddings import embed_texts
from app.db.database import Base, SessionLocal, engine

document_chunks_table = Table(
    "document_chunks",
    Base.metadata,
    Column("id", String(80), primary_key=True),
    Column("user_id", Integer, nullable=False, index=True),
    Column("document_id", Integer, nullable=False, index=True),
    Column("title", String(255), nullable=False, default=""),
    Column("chunk_index", Integer, nullable=False, default=0),
    Column("content", Text, nullable=False),
    Column("embedding", Text, nullable=False),
)


def _ensure_table() -> None:
    document_chunks_table.create(bind=engine, checkfirst=True)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class VectorStore:
    """SQLite 表 document_chunks 存向量，检索时用余弦相似度。"""

    def index_document(
        self,
        *,
        user_id: int,
        document_id: int,
        title: str,
        content: str,
    ) -> int:
        _ensure_table()
        self.delete_document(user_id=user_id, document_id=document_id)

        chunks = chunk_text(content, settings.rag_chunk_size, settings.rag_chunk_overlap)
        if not chunks:
            return 0

        embeddings = embed_texts(chunks)
        db = SessionLocal()
        try:
            for index, (chunk, vector) in enumerate(zip(chunks, embeddings)):
                db.execute(
                    document_chunks_table.insert().values(
                        id=f"u{user_id}_d{document_id}_c{index}",
                        user_id=user_id,
                        document_id=document_id,
                        title=title,
                        chunk_index=index,
                        content=chunk,
                        embedding=json.dumps(vector),
                    )
                )
            db.commit()
        finally:
            db.close()
        return len(chunks)

    def delete_document(self, *, user_id: int, document_id: int) -> None:
        _ensure_table()
        db = SessionLocal()
        try:
            db.execute(
                delete(document_chunks_table).where(
                    document_chunks_table.c.user_id == user_id,
                    document_chunks_table.c.document_id == document_id,
                )
            )
            db.commit()
        finally:
            db.close()

    def search(
        self,
        *,
        user_id: int,
        query: str,
        top_k: int | None = None,
    ) -> list[dict[str, Any]]:
        _ensure_table()
        limit = top_k or settings.rag_top_k
        query_vector = embed_texts([query])[0]

        db = SessionLocal()
        try:
            rows = db.execute(
                select(document_chunks_table).where(document_chunks_table.c.user_id == user_id)
            ).fetchall()
        finally:
            db.close()

        scored: list[tuple[float, dict[str, Any]]] = []
        for row in rows:
            vector = json.loads(row.embedding)
            score = _cosine_similarity(query_vector, vector)
            scored.append(
                (
                    score,
                    {
                        "document_id": row.document_id,
                        "title": row.title,
                        "content": row.content,
                        "score": score,
                    },
                )
            )

        scored.sort(key=lambda item: item[0], reverse=True)
        return [item[1] for item in scored[:limit]]


def get_vectorized_document_ids(user_id: int) -> set[int]:
    _ensure_table()
    db = SessionLocal()
    try:
        rows = db.execute(
            select(document_chunks_table.c.document_id)
            .where(document_chunks_table.c.user_id == user_id)
            .distinct()
        ).fetchall()
        return {row.document_id for row in rows}
    finally:
        db.close()


_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
