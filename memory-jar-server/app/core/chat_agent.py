from collections.abc import Iterator
from typing import Any, cast

from openai import OpenAI
from openai.types.chat import (
    ChatCompletionMessageParam,
    ChatCompletionMessageToolCallUnionParam,
    ChatCompletionToolUnionParam,
)

from app.core.chat_skill_loader import build_skill_system_prompt, get_skill_tools
from app.core.chat_tools import (
    NO_DOCUMENT_HITS_ANSWER,
    ToolContext,
    build_user_prompt_with_hits,
    execute_tool,
    format_document_list_answer,
    hits_to_sources,
    prefetch_search_hits,
    vector_index_unavailable_answer,
)
from app.core.config import settings

MAX_HISTORY_MESSAGES = 20
MAX_TOOL_ROUNDS = 5
_AGENT_TOOL_NAMES = ("calculate_due_date", "calculate_age_at_date")

_LIST_DOCUMENT_HINTS = (
    "有哪些",
    "哪些",
    "列出",
    "列表",
    "上传了",
    "上传的",
    "上传哪些",
    "什么文档",
    "哪些文档",
    "私人文档",
    "我的文档",
    "知识库里",
    "知识库有",
    "有什么文件",
    "有哪些文件",
)
_META_SUBJECTS = ("文档", "文件", "知识库")
_CONTENT_QUESTION_HINTS = (
    "内容",
    "提到",
    "写的",
    "里面",
    "油箱",
    "多大",
    "多少",
    "什么时候",
    "怎么",
    "为什么",
)


def is_document_list_question(question: str) -> bool:
    """用户是否在问「有哪些文档」类元问题，而非文档正文内容。"""
    q = question.strip()
    if not any(subject in q for subject in _META_SUBJECTS):
        return False
    if not any(hint in q for hint in _LIST_DOCUMENT_HINTS):
        return False
    if any(hint in q for hint in _CONTENT_QUESTION_HINTS):
        return False
    return True


def answer_document_list(*, user_id: int) -> dict:
    ctx = ToolContext(user_id=user_id)
    result = execute_tool(ctx, "list_user_documents", "{}")
    return {
        "answer": format_document_list_answer(result),
        "sources": [],
    }


def _build_client() -> OpenAI:
    if not settings.llm_api_key:
        raise ValueError("LLM API key is not configured")
    return OpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url or None,
    )


def _load_agent_tools(skill_name: str) -> list[ChatCompletionToolUnionParam]:
    tools = get_skill_tools(skill_name)
    filtered = [
        tool
        for tool in tools
        if tool.get("function", {}).get("name") in _AGENT_TOOL_NAMES
    ]
    return cast(list[ChatCompletionToolUnionParam], filtered)


def _message_content(message: ChatCompletionMessageParam) -> str:
    content = message.get("content")
    if isinstance(content, str):
        return content.strip()
    return ""


def _append_assistant_with_tool_calls(
    messages: list[ChatCompletionMessageParam],
    *,
    content: str | None,
    tool_calls: list[ChatCompletionMessageToolCallUnionParam],
) -> None:
    payload: dict[str, Any] = {
        "role": "assistant",
        "tool_calls": tool_calls,
    }
    if content:
        payload["content"] = content
    messages.append(cast(ChatCompletionMessageParam, payload))


def _build_messages(
    *,
    question: str,
    history: list[dict] | None,
    skill_name: str,
    hits: list[dict],
) -> list[ChatCompletionMessageParam]:
    messages: list[ChatCompletionMessageParam] = [
        {"role": "system", "content": build_skill_system_prompt(skill_name)},
    ]
    prior = history or []
    for msg in prior[-MAX_HISTORY_MESSAGES:]:
        role = msg.get("role")
        content = (msg.get("content") or "").strip()
        if role == "user" and content:
            messages.append({"role": "user", "content": content})
        elif role == "assistant" and content:
            messages.append({"role": "assistant", "content": content})

    messages.append(
        {"role": "user", "content": build_user_prompt_with_hits(question, hits)}
    )
    return messages


def _run_tool_loop(
    client: OpenAI,
    messages: list[ChatCompletionMessageParam],
    *,
    tools: list[ChatCompletionToolUnionParam],
    ctx: ToolContext,
) -> list[ChatCompletionMessageParam]:
    """执行 tool call 轮次，返回含最终 assistant 消息的 messages。"""
    for _ in range(MAX_TOOL_ROUNDS):
        request_kwargs: dict[str, Any] = {
            "model": settings.llm_model,
            "messages": messages,
            "temperature": 0.3,
        }
        if tools:
            request_kwargs["tools"] = tools
        response = client.chat.completions.create(**request_kwargs)
        assistant_message = response.choices[0].message
        tool_calls = assistant_message.tool_calls

        if not tool_calls:
            if assistant_message.content:
                messages.append(
                    {"role": "assistant", "content": assistant_message.content or ""}
                )
            return messages

        function_tool_calls: list[ChatCompletionMessageToolCallUnionParam] = []
        for tool_call in tool_calls:
            if tool_call.type != "function":
                continue
            function_tool_calls.append(
                cast(
                    ChatCompletionMessageToolCallUnionParam,
                    {
                        "id": tool_call.id,
                        "type": "function",
                        "function": {
                            "name": tool_call.function.name,
                            "arguments": tool_call.function.arguments or "{}",
                        },
                    },
                )
            )

        _append_assistant_with_tool_calls(
            messages,
            content=assistant_message.content,
            tool_calls=function_tool_calls,
        )

        for tool_call in tool_calls:
            if tool_call.type != "function":
                continue
            result = execute_tool(
                ctx,
                tool_call.function.name,
                tool_call.function.arguments or "{}",
            )
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result,
                }
            )

    raise ValueError("Tool call round limit exceeded")


def _finalize_answer(
    client: OpenAI,
    messages: list[ChatCompletionMessageParam],
) -> str:
    last = messages[-1]
    if last.get("role") != "assistant" or not _message_content(last):
        response = client.chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            temperature=0.3,
        )
        answer = (response.choices[0].message.content or "").strip()
    else:
        answer = _message_content(last)

    if not answer:
        raise ValueError("LLM returned empty answer")
    return answer


def run_agent_answer(
    *,
    user_id: int,
    question: str,
    history: list[dict] | None = None,
    skill_name: str = "knowledge_query",
) -> dict:
    """question 须为 API 层校验过的非空字符串。"""
    if is_document_list_question(question):
        return answer_document_list(user_id=user_id)

    blocked = vector_index_unavailable_answer(user_id)
    if blocked:
        return {"answer": blocked, "sources": []}

    ctx = ToolContext(user_id=user_id)
    hits = prefetch_search_hits(ctx, question=question, history=history)
    if not hits:
        return {"answer": NO_DOCUMENT_HITS_ANSWER, "sources": []}

    client = _build_client()
    tools = _load_agent_tools(skill_name)
    messages = _build_messages(
        question=question,
        history=history,
        skill_name=skill_name,
        hits=hits,
    )
    messages = _run_tool_loop(client, messages, tools=tools, ctx=ctx)
    answer = _finalize_answer(client, messages)

    return {"answer": answer, "sources": hits_to_sources(ctx.search_hits)}


def run_agent_stream(
    *,
    user_id: int,
    question: str,
    history: list[dict] | None = None,
    skill_name: str = "knowledge_query",
) -> tuple[Iterator[str], list[dict]]:
    """先检索 / 列文档，再流式输出最终回答。"""
    if is_document_list_question(question):
        answer = answer_document_list(user_id=user_id)["answer"]

        def list_generate() -> Iterator[str]:
            yield answer

        return list_generate(), []

    blocked = vector_index_unavailable_answer(user_id)
    if blocked:

        def blocked_generate() -> Iterator[str]:
            yield blocked

        return blocked_generate(), []

    ctx = ToolContext(user_id=user_id)
    hits = prefetch_search_hits(ctx, question=question, history=history)
    if not hits:

        def empty_generate() -> Iterator[str]:
            yield NO_DOCUMENT_HITS_ANSWER

        return empty_generate(), []

    client = _build_client()
    tools = _load_agent_tools(skill_name)
    messages = _build_messages(
        question=question,
        history=history,
        skill_name=skill_name,
        hits=hits,
    )
    messages = _run_tool_loop(client, messages, tools=tools, ctx=ctx)
    sources = hits_to_sources(ctx.search_hits)

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
