import { ImageResponse } from 'next/og'
import { type PageBlock } from 'notion-types'
import {
  getBlockIcon,
  getBlockTitle,
  getBlockValue,
  getPageProperty,
  isUrl,
  parsePageId
} from 'notion-utils'

import * as libConfig from '@/lib/config'
import { mapImageUrl } from '@/lib/map-image-url'
import { notion } from '@/lib/notion-api'

export const runtime = 'edge'

type PageError = {
  message: string
  statusCode: number
}

type NotionPageInfo = {
  pageId: string
  title: string
  image?: string
  imageObjectPosition?: string
  author?: string
  authorImage?: string
  detail?: string
}

export default async function OGImage(
  req: Request
) {
  const { searchParams } = new URL(req.url!)
  const pageId = parsePageId(
    searchParams.get('id') || libConfig.rootNotionPageId
  )
  if (!pageId) {
    return new Response('Invalid notion page id', { status: 400 })
  }

  let pageInfo: NotionPageInfo = {
    pageId,
    title: libConfig.name,
    image: undefined,
    imageObjectPosition: undefined,
    author: libConfig.author,
    authorImage: undefined,
    detail: libConfig.domain
  }

  try {
    const pageInfoOrError = await getNotionPageInfo({ pageId })
    if (pageInfoOrError.type === 'success') {
      pageInfo = pageInfoOrError.data
    }
  } catch (err) {
    console.warn('social-image fallback', { pageId, err })
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background:
          'linear-gradient(135deg, rgb(17, 24, 39) 0%, rgb(45, 52, 57) 45%, rgb(15, 23, 42) 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f8fafc'
      }}
    >
      <div
        style={{
          width: 900,
          height: 510,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 28,
          backgroundColor: 'rgba(15, 23, 42, 0.45)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 220,
            height: 220,
            borderRadius: 9999,
            border: '6px solid rgba(255, 255, 255, 0.32)',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            boxShadow: '0 18px 46px rgba(0, 0, 0, 0.35)'
          }}
        >
          <div style={{ fontSize: 132, fontWeight: 800, lineHeight: 1 }}>T</div>
        </div>

        <div
          style={{
            marginTop: 44,
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: -1
          }}
        >
          {pageInfo.title || libConfig.name}
        </div>

        <div
          style={{
            marginTop: 16,
            display: 'flex',
            fontSize: 30,
            opacity: 0.82
          }}
        >
          {pageInfo.detail || libConfig.domain}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630
    }
  )
}

export async function getNotionPageInfo({
  pageId
}: {
  pageId: string
}): Promise<
  | { type: 'success'; data: NotionPageInfo }
  | { type: 'error'; error: PageError }
> {
  const recordMap = await notion.getPage(pageId)

  const keys = Object.keys(recordMap?.block || {})
  const block = getBlockValue(recordMap?.block?.[keys[0]!])

  if (!block) {
    throw new Error('Invalid recordMap for page')
  }

  const blockSpaceId = block.space_id

  if (
    blockSpaceId &&
    libConfig.rootNotionSpaceId &&
    blockSpaceId !== libConfig.rootNotionSpaceId
  ) {
    return {
      type: 'error',
      error: {
        statusCode: 400,
        message: `Notion page "${pageId}" belongs to a different workspace.`
      }
    }
  }

  const isBlogPost =
    block.type === 'page' && block.parent_table === 'collection'
  const title = getBlockTitle(block, recordMap) || libConfig.name

  const imageCoverPosition =
    (block as PageBlock).format?.page_cover_position ??
    libConfig.defaultPageCoverPosition
  const imageObjectPosition = imageCoverPosition
    ? `center ${(1 - imageCoverPosition) * 100}%`
    : undefined

  const imageBlockUrl = mapImageUrl(
    getPageProperty<string>('Social Image', block, recordMap) ||
      (block as PageBlock).format?.page_cover,
    block
  )
  const imageFallbackUrl = mapImageUrl(libConfig.defaultPageCover, block)

  const blockIcon = getBlockIcon(block, recordMap)
  const authorImageBlockUrl = mapImageUrl(
    blockIcon && isUrl(blockIcon) ? blockIcon : undefined,
    block
  )
  const authorImageFallbackUrl = mapImageUrl(libConfig.defaultPageIcon, block)
  const [authorImage, image] = await Promise.all([
    getCompatibleImageUrl(authorImageBlockUrl, authorImageFallbackUrl),
    getCompatibleImageUrl(imageBlockUrl, imageFallbackUrl)
  ])

  const author =
    getPageProperty<string>('Author', block, recordMap) || libConfig.author

  // const socialDescription =
  //   getPageProperty<string>('Description', block, recordMap) ||
  //   libConfig.description

  // const lastUpdatedTime = getPageProperty<number>(
  //   'Last Updated',
  //   block,
  //   recordMap
  // )
  const publishedTime = getPageProperty<number>('Published', block, recordMap)
  const datePublished = publishedTime ? new Date(publishedTime) : undefined
  // const dateUpdated = lastUpdatedTime
  //   ? new Date(lastUpdatedTime)
  //   : publishedTime
  //   ? new Date(publishedTime)
  //   : undefined
  const date =
    isBlogPost && datePublished
      ? `${datePublished.toLocaleString('en-US', {
          month: 'long'
        })} ${datePublished.getFullYear()}`
      : undefined
  const detail = date || author || libConfig.domain

  const pageInfo: NotionPageInfo = {
    pageId,
    title,
    image,
    imageObjectPosition,
    author,
    authorImage,
    detail
  }

  return {
    type: 'success',
    data: pageInfo
  }
}

async function isUrlReachable(
  url: string | undefined | null
): Promise<boolean> {
  if (!url) {
    return false
  }

  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

async function getCompatibleImageUrl(
  url: string | undefined | null,
  fallbackUrl: string | undefined | null
): Promise<string | undefined> {
  const image = (await isUrlReachable(url)) ? url : fallbackUrl

  if (image) {
    const imageUrl = new URL(image)

    if (imageUrl.host === 'images.unsplash.com') {
      if (!imageUrl.searchParams.has('w')) {
        imageUrl.searchParams.set('w', '1200')
        imageUrl.searchParams.set('fit', 'max')
        return imageUrl.toString()
      }
    }
  }

  return image ?? undefined
}
