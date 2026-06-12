export interface XlsxSheetTable {
  title: string
  rows: string[][]
}

/** 解析后端 extract_xlsx_text 输出的 tab 分隔文本 */
export function parseXlsxContent(content: string): XlsxSheetTable[] {
  const sheets: XlsxSheetTable[] = []
  let current: XlsxSheetTable | null = null

  for (const line of content.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith('## ')) {
      current = { title: trimmed.slice(3).trim() || 'Sheet', rows: [] }
      sheets.push(current)
      continue
    }

    if (!current) {
      current = { title: 'Sheet1', rows: [] }
      sheets.push(current)
    }

    current.rows.push(line.split('\t'))
  }

  return sheets.filter((sheet) => sheet.rows.length > 0)
}
