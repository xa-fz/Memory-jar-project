from collections.abc import Iterator

from openai import OpenAI
from openai.types.chat import ChatCompletionMessageParam

from app.core.config import settings
from app.core.vector_store import get_vector_store

MAX_HISTORY_MESSAGES = 20
MAX_HISTORY_FOR_SEARCH = 6

SYSTEM_PROMPT_WITH_CONTEXT = (
    "你是 Memory Jar 私人知识库助手。优先依据用户文档片段回答问题；"
    "若片段与问题无关，可结合常识作答，必要时简短说明未在文档中找到直接依据。"
    "请结合对话上下文中用户已说明的信息（如物品型号、时间、地点等）理解后续追问。"
    "涉及缴费周期、上次交费时间等问题时，请根据片段中的日期与周期推算到期时间并明确写出。"
    "回答使用中文，简洁准确，直接给出结论或建议。"
    "不要以「根据文档显示」「根据文档片段」「检索到」「资料显示」等套话开头，也不要反复提及文档或片段来源（界面会单独展示引用）。"
)

SYSTEM_PROMPT_NO_CONTEXT = (
    "你是 Memory Jar 助手。用户暂无相关文档片段，请基于常识与对话上下文回答。"
    "请结合用户在前文已说明的信息理解后续追问。"
    "回答使用中文，简洁准确，直接作答。"
    "不要以「根据文档显示」「根据文档片段」等套话开头。"
)


def _build_client() -> OpenAI:
    if not settings.llm_api_key:
        raise ValueError("LLM API key is not configured")
    return OpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url or None,
    )


def _build_search_query(question: str, history: list[dict]) -> str:
    """结合最近几轮对话构造检索 query，便于理解「我的油箱多大」这类追问。"""
    recent = history[-MAX_HISTORY_FOR_SEARCH:] if history else []
    parts = [m["content"].strip() for m in recent if m.get("content", "").strip()]
    text = question.strip()
    if text and (not parts or parts[-1] != text):
        parts.append(text)
    return "\n".join(parts) if parts else text


def _build_user_prompt(question: str, contexts: list[dict]) -> str:
    if not contexts:
        return question

    blocks = []
    for index, item in enumerate(contexts, start=1):
        title = item.get("title") or "未命名文档"
        snippet = (item.get("content") or "").strip()
        blocks.append(f"[片段 {index}] 文档：{title}\n{snippet}")

    joined = "\n\n".join(blocks)
    return (
        f"用户问题：{question}\n\n"
        f"以下是从用户文档中检索到的相关片段：\n\n{joined}\n\n"
        "请基于上述片段与对话上下文直接回答，不要在回答开头或文中刻意提及文档、片段或检索过程。"
    )


def _build_sources(hits: list[dict]) -> list[dict]:
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


def _prepare_llm_messages(
    *,
    user_id: int,
    question: str,
    history: list[dict] | None = None,
) -> tuple[list[dict], list[ChatCompletionMessageParam], list[dict]]:
    text = question.strip()
    if not text:
        raise ValueError("Question is empty")

    prior = history or []
    search_query = _build_search_query(text, prior)
    hits = get_vector_store().search(user_id=user_id, query=search_query)

    system_prompt = SYSTEM_PROMPT_WITH_CONTEXT if hits else SYSTEM_PROMPT_NO_CONTEXT
    messages: list[ChatCompletionMessageParam] = [{"role": "system", "content": system_prompt}]
    for msg in prior[-MAX_HISTORY_MESSAGES:]:
        role = msg.get("role")
        content = (msg.get("content") or "").strip()
        if role == "user" and content:
            messages.append({"role": "user", "content": content})
        elif role == "assistant" and content:
            messages.append({"role": "assistant", "content": content})

    messages.append({"role": "user", "content": _build_user_prompt(text, hits)})
    return hits, messages, _build_sources(hits)


def answer_question(
    *,
    user_id: int,
    question: str,
    history: list[dict] | None = None,
) -> dict:
    _, messages, sources = _prepare_llm_messages(
        user_id=user_id,
        question=question,
        history=history,
    )

    client = _build_client()
    response = client.chat.completions.create(
        model=settings.llm_model,
        messages=messages,
        temperature=0.3,
    )

    answer = (response.choices[0].message.content or "").strip()
    if not answer:
        raise ValueError("LLM returned empty answer")

    return {"answer": answer, "sources": sources}


def stream_answer_text(
    *,
    user_id: int,
    question: str,
    history: list[dict] | None = None,
) -> tuple[Iterator[str], list[dict]]:
    _, messages, sources = _prepare_llm_messages(
        user_id=user_id,
        question=question,
        history=history,
    )

    client = _build_client()
    stream = client.chat.completions.create(
        model=settings.llm_model,
        messages=messages,
        temperature=0.3,
        stream=True,
    )

    def generate() -> Iterator[str]:
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    return generate(), sources
