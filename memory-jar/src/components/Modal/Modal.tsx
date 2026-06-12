import { Modal as MantineModal, type ModalProps as MantineModalProps } from '@mantine/core'
import clsx from 'clsx'
import classes from './Modal.module.css'

/** 标题栏高度估算，用于 body 固定高度计算 */
const MODAL_HEADER_HEIGHT = 48

export interface ModalProps extends MantineModalProps {
  /** 自定义弹窗宽度，如 960 或 '90vw' */
  width?: number | string
  /** 弹窗固定高度；默认 'auto' 随内容，需固定高度时传入数字或 px 字符串 */
  height?: number | string
}

/** 项目通用 Modal，统一默认样式与 Mantine 封装 */
export function Modal({
  classNames,
  centered = true,
  width,
  height = 'auto',
  size,
  styles,
  ...props
}: ModalProps) {
  const resolvedWidth =
    width === undefined ? undefined : typeof width === 'number' ? `${width}px` : width

  const resolvedHeight =
    height === 'auto' ? undefined : typeof height === 'number' ? `${height}px` : height

  return (
    <MantineModal
      centered={centered}
      size={resolvedWidth ? 'auto' : size}
      styles={{
        ...styles,
        content: {
          ...(resolvedHeight
            ? {
                overflow: 'hidden',
                height: resolvedHeight,
                maxHeight: resolvedHeight,
                '--modal-content-height': resolvedHeight,
                '--modal-height': resolvedHeight,
              }
            : null),
          ...(resolvedWidth ? { width: resolvedWidth, maxWidth: '95vw' } : null),
          ...(typeof styles?.content === 'object' ? styles.content : null),
        },
        body: {
          display: 'block',
          ...(resolvedHeight
            ? {
                overflowY: 'auto',
                height: `calc(${resolvedHeight} - ${MODAL_HEADER_HEIGHT}px)`,
              }
            : null),
          ...(typeof styles?.body === 'object' ? styles.body : null),
        },
      }}
      classNames={{
        ...classNames,
        title: clsx(classes.title, classNames?.title),
        content: clsx(classes.content, classNames?.content),
        body: clsx(classes.body, classNames?.body),
      }}
      {...props}
    />
  )
}
