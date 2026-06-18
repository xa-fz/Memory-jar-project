import json
from calendar import monthrange
from dataclasses import dataclass, field
from datetime import date, datetime

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.vector_store import get_vector_store, get_vectorized_document_ids
from app.db.database import SessionLocal
from app.db.models import Document


MAX_HISTORY_FOR_SEARCH = 6
NO_DOCUMENT_HITS_ANSWER = "未在您的文档中找到与这个问题相关的信息，我无法从私人文档中回答。"
NOT_VECTORIZED_ANSWER = "请先在「文档」页对文件完成向量化后再提问。"
NO_DOCUMENTS_ANSWER = "您还没有上传任何文档。"


@dataclass
class ToolContext:
    user_id: int
    search_hits: list[dict] = field(default_factory=list)


def build_search_query(question: str, history: list[dict] | None) -> str:
    prior = history or []
    recent = prior[-MAX_HISTORY_FOR_SEARCH:]
    parts = [m["content"].strip() for m in recent if m.get("content", "").strip()]
    if not parts or parts[-1] != question:
        parts.append(question)
    return "\n".join(parts)


def _merge_search_hits(hit_groups: list[list[dict]]) -> list[dict]:
    seen: set[tuple[int | None, str]] = set()
    merged: list[dict] = []
    for hits in hit_groups:
        for hit in hits:
            key = (hit.get("document_id"), hit.get("content") or "")
            if key in seen:
                continue
            seen.add(key)
            merged.append(hit)
    merged.sort(key=lambda item: float(item.get("score") or 0), reverse=True)
    return merged[: settings.rag_top_k]


def prefetch_search_hits(
    ctx: ToolContext,
    *,
    question: str,
    history: list[dict] | None,
) -> list[dict]:
    store = get_vector_store()
    hit_groups = [store.search(user_id=ctx.user_id, query=question)]
    if history:
        contextual_query = build_search_query(question, history)
        if contextual_query != question:
            hit_groups.append(store.search(user_id=ctx.user_id, query=contextual_query))

    hits = _merge_search_hits(hit_groups)
    ctx.search_hits.clear()
    ctx.search_hits.extend(hits)
    return hits


def vector_index_unavailable_answer(user_id: int) -> str | None:
    """未建立向量索引时返回提示；已向量化则返回 None，继续走检索。"""
    if get_vectorized_document_ids(user_id):
        return None

    db = SessionLocal()
    try:
        doc_count = db.query(Document).filter(Document.user_id == user_id).count()
    finally:
        db.close()

    if doc_count == 0:
        return NO_DOCUMENTS_ANSWER
    return NOT_VECTORIZED_ANSWER


def format_document_list_answer(result_json: str) -> str:
    data = json.loads(result_json)
    docs = data.get("documents") or []
    if not docs:
        return "您还没有上传任何文档。"

    lines = []
    for index, doc in enumerate(docs, start=1):
        title = doc.get("title") or "未命名文档"
        file_type = (doc.get("file_type") or "").strip()
        suffix = f"（{file_type}）" if file_type else ""
        lines.append(f"{index}. {title}{suffix}")
    return "您已上传以下文档：\n" + "\n".join(lines)


def build_user_prompt_with_hits(question: str, hits: list[dict]) -> str:
    blocks = []
    for index, item in enumerate(hits, start=1):
        title = item.get("title") or "未命名文档"
        snippet = (item.get("content") or "").strip()
        blocks.append(f"[片段 {index}] 文档：{title}\n{snippet}")

    joined = "\n\n".join(blocks)
    return (
        f"用户问题：{question}\n\n"
        f"以下是从用户文档中检索到的相关片段：\n\n{joined}\n\n"
        "请基于上述片段回答。"
        "若片段中有某参考日期的年龄（如「半岁」=0.5 岁），且用户问其他年份/日期的年龄，"
        "可结合片段推算，必要时调用 calculate_age_at_date；简要说明推算依据。"
        "若片段中完全没有相关人物、日期或年龄信息，才说明「文档中未找到相关信息」，不要编造。"
    )


def hits_to_sources(hits: list[dict]) -> list[dict]:
    sources = []
    seen_doc_ids: set[int] = set()
    for hit in hits:
        doc_id = hit.get("document_id")
        if doc_id is None or doc_id in seen_doc_ids:
            continue
        seen_doc_ids.add(doc_id)
        snippet = (hit.get("content") or "").strip()
        if len(snippet) > 200:
            snippet = f"{snippet[:200]}..."
        sources.append(
            {
                "document_id": doc_id,
                "title": hit.get("title") or "",
                "snippet": snippet,
            }
        )
    return sources


def _add_months(start: date, months: int) -> date:
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    day = min(start.day, monthrange(year, month)[1])
    return date(year, month, day)


def _tool_search_knowledge_base(ctx: ToolContext, arguments: dict) -> str:
    query = (arguments.get("query") or "").strip()
    if not query:
        return json.dumps({"error": "query is required"}, ensure_ascii=False)

    top_k = arguments.get("top_k") or settings.rag_top_k
    try:
        top_k = int(top_k)
    except (TypeError, ValueError):
        top_k = settings.rag_top_k

    hits = get_vector_store().search(user_id=ctx.user_id, query=query, top_k=top_k)
    ctx.search_hits.extend(hits)

    if not hits:
        return json.dumps({"fragments": [], "message": "未检索到相关片段"}, ensure_ascii=False)

    fragments = []
    for index, hit in enumerate(hits, start=1):
        fragments.append(
            {
                "index": index,
                "document_id": hit.get("document_id"),
                "title": hit.get("title") or "未命名文档",
                "content": hit.get("content") or "",
                "score": round(float(hit.get("score") or 0), 4),
            }
        )
    return json.dumps({"fragments": fragments}, ensure_ascii=False)


def _tool_calculate_due_date(_: ToolContext, arguments: dict) -> str:
    last_paid = (arguments.get("last_paid") or "").strip()
    cycle_months = arguments.get("cycle_months")
    if not last_paid or cycle_months is None:
        return json.dumps({"error": "last_paid and cycle_months are required"}, ensure_ascii=False)

    try:
        paid_date = datetime.strptime(last_paid, "%Y-%m-%d").date()
        months = int(cycle_months)
    except (ValueError, TypeError):
        return json.dumps(
            {"error": "last_paid 须为 YYYY-MM-DD，cycle_months 须为整数"},
            ensure_ascii=False,
        )

    if months <= 0:
        return json.dumps({"error": "cycle_months 须大于 0"}, ensure_ascii=False)

    due_date = _add_months(paid_date, months)
    return json.dumps(
        {
            "last_paid": last_paid,
            "cycle_months": months,
            "due_date": due_date.isoformat(),
        },
        ensure_ascii=False,
    )


def _parse_target_date(value: str, *, reference: date) -> date:
    value = value.strip()
    if len(value) == 4 and value.isdigit():
        year = int(value)
        day = min(reference.day, monthrange(year, reference.month)[1])
        return date(year, reference.month, day)
    return datetime.strptime(value, "%Y-%m-%d").date()


def _tool_calculate_age_at_date(_: ToolContext, arguments: dict) -> str:
    reference_date = (arguments.get("reference_date") or "").strip()
    target_date = (arguments.get("target_date") or "").strip()
    age_years = arguments.get("age_years")

    if not reference_date or not target_date or age_years is None:
        return json.dumps(
            {"error": "reference_date, target_date and age_years are required"},
            ensure_ascii=False,
        )

    try:
        ref = datetime.strptime(reference_date, "%Y-%m-%d").date()
        target = _parse_target_date(target_date, reference=ref)
        age_at_ref = float(age_years)
    except (ValueError, TypeError):
        return json.dumps(
            {
                "error": "reference_date 须为 YYYY-MM-DD；target_date 为 YYYY-MM-DD 或 YYYY；age_years 为数字（半岁=0.5）"
            },
            ensure_ascii=False,
        )

    age_at_target = age_at_ref + (target - ref).days / 365.25
    return json.dumps(
        {
            "reference_date": reference_date,
            "age_at_reference_years": age_at_ref,
            "target_date": target.isoformat(),
            "age_at_target_years": round(age_at_target, 1),
        },
        ensure_ascii=False,
    )


def _tool_list_user_documents(ctx: ToolContext, _: dict) -> str:
    db: Session = SessionLocal()
    try:
        docs = (
            db.query(Document)
            .filter(Document.user_id == ctx.user_id)
            .order_by(Document.created_at.desc())
            .all()
        )
        items = [
            {
                "id": doc.id,
                "title": doc.title,
                "file_type": doc.file_type,
                "created_at": doc.created_at.isoformat() if doc.created_at else "",
            }
            for doc in docs
        ]
    finally:
        db.close()

    return json.dumps({"documents": items, "total": len(items)}, ensure_ascii=False)


_TOOL_HANDLERS = {
    "search_knowledge_base": _tool_search_knowledge_base,
    "calculate_due_date": _tool_calculate_due_date,
    "calculate_age_at_date": _tool_calculate_age_at_date,
    "list_user_documents": _tool_list_user_documents,
}


def execute_tool(ctx: ToolContext, name: str, arguments_json: str) -> str:
    handler = _TOOL_HANDLERS.get(name)
    if not handler:
        return json.dumps({"error": f"unknown tool: {name}"}, ensure_ascii=False)

    try:
        arguments = json.loads(arguments_json or "{}")
    except json.JSONDecodeError:
        return json.dumps({"error": "invalid tool arguments JSON"}, ensure_ascii=False)

    if not isinstance(arguments, dict):
        return json.dumps({"error": "tool arguments must be an object"}, ensure_ascii=False)

    return handler(ctx, arguments)
