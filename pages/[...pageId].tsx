import { type GetStaticProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import { domain, pageUrlOverrides } from '@/lib/config'
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
    return { props, revalidate: 3600 }
  } catch (err: any) {
    console.error('page error', domain, rawPageId, err)
    return {
      props: { error: { message: err.message || 'Failed', statusCode: 500 } },
      revalidate: 3600
    }
  }
}

export async function getStaticPaths() {
  const pageIds = Object.keys(pageUrlOverrides || {})

  const paths = pageIds
    .filter(p => p !== '/' && p !== '')
    .map((pageId: string) => ({
      params: { pageId: pageId.split('/').filter(Boolean) }
    }))

  return { paths, fallback: false }
}

export default function NotionDomainDynamicPage(props: PageProps) {
  return <NotionPage {...props} />
}