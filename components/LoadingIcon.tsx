import cs from 'classnames'

import styles from './styles.module.css'

export function LoadingIcon(props: any) {
  const { className, ...rest } = props
  return (
    <div
      className={cs(styles.loadingIcon, className)}
      {...rest}
      role='status'
      aria-label='Loading'
    />
  )
}
