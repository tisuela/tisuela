import { type GetStaticProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { type PageProps, type Params } from '@/lib/types'

export const getStaticProps: GetStaticProps<PageProps, Params> = async (
  context
) => {
  const rawPageIdParam = context.params?.pageId
  const rawPageId = Array.isArray(rawPageIdParam)
    ? rawPageIdParam.join('/')
    : (rawPageIdParam as string)

  try {
    const props = await resolveNotionPage(domain, rawPageId)

    if (props.error) {
      return { props: { error: props.error }, revalidate: 60 }
    }

    return { props, revalidate: 10 }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)

    return {
      props: {
        error: {
          message: err.message || 'Failed to load page',
          statusCode: 500
        }
      },
      revalidate: 60
    }
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getStaticPaths() {
  if (isDev) {
    return {
      paths: [],
      fallback: true
    }
  }

  return {
    paths: [],
    fallback: true
  }
}

export default function NotionDomainDynamicPage(props: PageProps) {
  return <NotionPage {...props} />
}