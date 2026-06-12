import { Modal as MantineModal, type ModalProps as MantineModalProps } from '@mantine/core'
import classes from './Modal.module.css'

export interface ModalProps extends MantineModalProps {
  /** 自定义弹窗宽度，如 960 或 '90vw' */
  width?: number | string
}

/** 项目通用 Modal，统一默认样式与 Mantine 封装 */
export function Modal({
  classNames,
  centered = true,
  width,
  size,
  styles,
  ...props
}: ModalProps) {
  const resolvedWidth =
    width === undefined ? undefined : typeof width === 'number' ? `${width}px` : width

  return (
    <MantineModal
      centered={centered}
      size={resolvedWidth ? 'auto' : size}
      styles={{
        ...styles,
        content: {
          ...(resolvedWidth ? { width: resolvedWidth, maxWidth: '95vw' } : null),
          ...(typeof styles?.content === 'object' ? styles.content : null),
        },
      }}
      classNames={{
        root: classes.root,
        title: classes.title,
        ...classNames,
      }}
      {...props}
    />
  )
}
