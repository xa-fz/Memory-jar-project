import { Table, Text } from '@mantine/core'
import classes from '../FilePreview.module.css'

export interface TablePreviewProps {
  rows: string[][]
  /** 第一行作为表头，默认 true */
  firstRowIsHeader?: boolean
}

export function TablePreview({ rows, firstRowIsHeader = true }: TablePreviewProps) {
  if (rows.length === 0) return null

  const [headerRow, ...bodyRows] = rows
  const hasHeader = firstRowIsHeader && rows.length > 1
  const columns = Math.max(...rows.map((cells) => cells.length), headerRow.length)

  return (
    <Table
      className={classes.csvTable}
      striped
      highlightOnHover
      withTableBorder
      withColumnBorders
      horizontalSpacing="sm"
      verticalSpacing="xs"
      fz="sm"
    >
      {hasHeader ? (
        <Table.Thead>
          <Table.Tr>
            {Array.from({ length: columns }, (_, index) => (
              <Table.Th key={`h-${index}`}>{headerRow[index] || '—'}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
      ) : null}
      <Table.Tbody>
        {(hasHeader ? bodyRows : rows).map((cells, rowIndex) => (
          <Table.Tr key={`r-${rowIndex}`}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <Table.Td key={`c-${rowIndex}-${colIndex}`}>
                <Text size="sm" className={classes.csvCell}>
                  {cells[colIndex] ?? ''}
                </Text>
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
