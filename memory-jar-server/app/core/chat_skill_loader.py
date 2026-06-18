import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

_SKILLS_DIR = Path(__file__).resolve().parent.parent / "prompts" / "skills"
_DEFAULT_SKILL = "knowledge_query"
_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
_JSON_BLOCK_RE = re.compile(r"```json\s*\n(.*?)```", re.DOTALL)


def _parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    match = _FRONTMATTER_RE.match(text)
    if not match:
        return {}, text

    meta: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip()

    body = text[match.end() :]
    return meta, body


def _parse_instructions(body: str) -> str:
    match = re.search(r"^##\s+回答规则\s*\n(.*?)(?=^##\s+|\Z)", body, re.MULTILINE | re.DOTALL)
    if not match:
        return body.strip()

    section = match.group(1).strip()
    lines: list[str] = []
    for line in section.splitlines():
        stripped = line.strip()
        if stripped.startswith("- "):
            lines.append(stripped[2:].strip())
        elif stripped:
            lines.append(stripped)
    return "\n".join(lines)


def _parse_tools(body: str) -> list[dict[str, Any]]:
    tools_section = re.search(r"^##\s+工具接口\s*\n(.*)", body, re.MULTILINE | re.DOTALL)
    if not tools_section:
        return []

    tools: list[dict[str, Any]] = []
    for block in _JSON_BLOCK_RE.findall(tools_section.group(1)):
        tool = json.loads(block.strip())
        tools.append(tool)
    return tools


def _parse_md_skill(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    meta, body = _parse_frontmatter(text)
    instructions = _parse_instructions(body)
    tools = _parse_tools(body)

    if not meta.get("name"):
        meta["name"] = path.stem

    return {
        "name": meta.get("name", path.stem),
        "description": meta.get("description", ""),
        "instructions": instructions,
        "tools": tools,
    }


def _resolve_skill_path(skill_name: str) -> Path:
    md_path = _SKILLS_DIR / f"{skill_name}.md"
    if md_path.is_file():
        return md_path

    json_path = _SKILLS_DIR / f"{skill_name}.json"
    if json_path.is_file():
        return json_path

    raise FileNotFoundError(f"Chat skill not found: {md_path} or {json_path}")


@lru_cache
def load_chat_skill(skill_name: str = _DEFAULT_SKILL) -> dict[str, Any]:
    path = _resolve_skill_path(skill_name)

    if path.suffix == ".md":
        data = _parse_md_skill(path)
    else:
        data = json.loads(path.read_text(encoding="utf-8"))
        instructions = data.get("instructions") or []
        if isinstance(instructions, list):
            data["instructions"] = "\n".join(str(line) for line in instructions)

    if not data.get("tools"):
        raise ValueError(f"Chat skill {skill_name} has no tools defined")
    return data


def build_skill_system_prompt(skill_name: str = _DEFAULT_SKILL) -> str:
    skill = load_chat_skill(skill_name)
    instructions = skill.get("instructions") or ""
    return str(instructions).strip()


def get_skill_tools(skill_name: str = _DEFAULT_SKILL) -> list[dict[str, Any]]:
    return list(load_chat_skill(skill_name)["tools"])
