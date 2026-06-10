import type { DropzoneProps } from '@mantine/dropzone'
import type { ModalProps } from '@mantine/core'

export interface UploadModalProps {
  opened: boolean
  onClose: () => void
  /** 选中文件并点击确认后触发，可返回 Promise */
  onUpload: (file: File) => void | Promise<void>
  /** 弹窗标题，默认「上传文件」 */
  title?: string
  /** 拖拽区主提示，默认「点击选择文件，或拖拽到此处」 */
  dropzoneHint?: string
  /** 格式说明，显示在拖拽区下方，如「支持 .txt、.pdf…」 */
  acceptHint?: string
  /** Dropzone accept，不传则不做类型限制 */
  accept?: DropzoneProps['accept']
  /** 单文件大小上限（字节），默认 20MB */
  maxSize?: number
  /** 是否允许多选，默认 false */
  multiple?: boolean
  confirmLabel?: string
  cancelLabel?: string
  selectedLabel?: string
  /** 传给底层 Modal 的其余属性 */
  modalProps?: Omit<ModalProps, 'opened' | 'onClose' | 'title' | 'children'>
}
