from collections.abc import Iterator

from app.core.chat_agent import run_agent_answer, run_agent_stream


def answer_question(
    *,
    user_id: int,
    question: str,
    history: list[dict] | None = None,
) -> dict:
    """question 须为 API 层校验过的非空字符串。"""
    return run_agent_answer(user_id=user_id, question=question, history=history)


def stream_answer_text(
    *,
    user_id: int,
    question: str,
    history: list[dict] | None = None,
) -> tuple[Iterator[str], list[dict]]:
    return run_agent_stream(user_id=user_id, question=question, history=history)
