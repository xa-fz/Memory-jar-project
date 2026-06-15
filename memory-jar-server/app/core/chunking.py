def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    normalized = text.replace("\r\n", "\n").strip()
    if not normalized:
        return []

    chunks: list[str] = []
    start = 0
    length = len(normalized)

    while start < length:
        end = min(start + chunk_size, length)
        if end < length:
            break_at = normalized.rfind("\n", start, end)
            if break_at > start + chunk_size // 2:
                end = break_at + 1

        piece = normalized[start:end].strip()
        if piece:
            chunks.append(piece)

        if end >= length:
            break
        start = max(end - overlap, start + 1)

    return chunks
