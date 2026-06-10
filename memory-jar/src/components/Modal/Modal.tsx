import { Modal as MantineModal, type ModalProps } from '@mantine/core'
import classes from './Modal.module.css'

export type { ModalProps }

/** 项目通用 Modal，统一默认样式与 Mantine 封装 */
export function Modal({ classNames, centered = true, ...props }: ModalProps) {
  return (
    <MantineModal
      centered={centered}
      classNames={{
        root: classes.root,
        title: classes.title,
        ...classNames,
      }}
      {...props}
    />
  )
}
