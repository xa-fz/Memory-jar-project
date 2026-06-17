from openai import OpenAI

from app.core.config import settings

MAX_SUMMARY_INPUT_CHARS = 12_000

SYSTEM_PROMPT = (
    "你是文档摘要助手。根据用户提供的文档正文，用中文生成简洁摘要。"
    "要求：2～4 句话，不超过 100 字，只输出摘要正文，不要标题或前缀说明。"
)


def _build_client() -> OpenAI:
    if not settings.llm_api_key:
        raise ValueError("LLM API key is not configured")
    return OpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url or None,
    )


def generate_summary(content: str) -> str:
    """content 须为调用方已校验的非空文档正文。"""
    text = content
    if len(text) > MAX_SUMMARY_INPUT_CHARS:
        text = f"{text[:MAX_SUMMARY_INPUT_CHARS]}\n\n[内容已截断]"

    client = _build_client()
    response = client.chat.completions.create(
        model=settings.llm_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"请为以下文档生成摘要：\n\n{text}"},
        ],
        temperature=0.3,
    )
    summary = (response.choices[0].message.content or "").strip()
    if not summary:
        raise ValueError("LLM returned empty summary")
    return summary
