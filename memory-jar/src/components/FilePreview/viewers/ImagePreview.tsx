import classes from '../FilePreview.module.css'

export interface ImagePreviewProps {
  src: string
  alt?: string
}

export function ImagePreview({ src, alt = '' }: ImagePreviewProps) {
  return (
    <div className={classes.imageWrap}>
      <img className={classes.image} src={src} alt={alt} />
    </div>
  )
}
