import { type GetStaticProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev, pageUrlOverrides } from '@/lib/config'
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

    return { props, revalidate: 10 }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)

    throw err
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

  const overridePageIds = Object.keys(pageUrlOverrides)

  console.log(`pre-rendering ${overridePageIds.length} override pages...`)

  const paths: Array<{ params: { pageId: string[] } }> = []

  for (let i = 0; i < overridePageIds.length; i++) {
    const pageId = overridePageIds[i]!
    paths.push({ params: { pageId: pageId.split('/').filter(Boolean) } })

    console.log(`pre-rendered ${i + 1}/${overridePageIds.length}: ${pageId}`)

    if (i < overridePageIds.length - 1) {
      await delay(1500)
    }
  }

  console.log(`done pre-rendering ${paths.length} override paths`)

  return {
    paths,
    fallback: 'blocking'
  }
}

export default function NotionDomainDynamicPage(props: PageProps) {
  return <NotionPage {...props} />
}