import Image from 'next/image'

import styles from './styles.module.css'

export function ErrorPage({
  statusCode,
  onRetry
}: {
  statusCode: number
  onRetry?: () => void
}) {
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1>Error Loading Page</h1>

        {statusCode && <p>Error code: {statusCode}</p>}

        {onRetry && (
          <button type='button' onClick={onRetry}>
            Try again
          </button>
        )}

        <Image
          src='/error.png'
          alt='Error'
          width={300}
          height={300}
          className={styles.errorImage}
        />
      </main>
    </div>
  )
}
