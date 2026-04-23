import {
  type ExtendedRecordMap,
  type SearchParams,
  type SearchResults
} from 'notion-types'
import { mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle
} from './config'
import { getTweetsMap } from './get-tweets'
import { notion } from './notion-api'
import { getPreviewImageMap } from './preview-images'

const pageCache = new Map<string, ExtendedRecordMap>()

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err: any) {
      if (err.statusCode === 429 && i < retries - 1) {
        let delay = Math.pow(2, i) * 1000
        if (err.headers?.['retry-after']) {
          const retryAfter = parseInt(err.headers['retry-after'], 10)
          if (!isNaN(retryAfter)) {
            delay = retryAfter * 1000
          }
        }
        console.warn(`rate limited, retrying in ${delay}ms...`)
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      throw err
    }
  }
  throw new Error('max retries exceeded')
}

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => link?.pageId)
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) =>
          fetchWithRetry(() =>
            notion.getPage(navigationLinkPageId, {
              chunkLimit: 1,
              fetchMissingBlocks: false,
              fetchCollections: false,
              signFileUrls: false
            })
          ),
        {
          concurrency: 4
        }
      )
    }

    return []
  }
)

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  const cached = pageCache.get(pageId)
  if (cached) {
    return cached
  }

  let recordMap = await fetchWithRetry(() => notion.getPage(pageId))

  if (navigationStyle !== 'default') {
    const navigationLinkRecordMaps = await getNavigationLinkPages()

    if (navigationLinkRecordMaps?.length) {
      recordMap = navigationLinkRecordMaps.reduce(
        (map, navigationLinkRecordMap) =>
          mergeRecordMaps(map, navigationLinkRecordMap),
        recordMap
      )
    }
  }

  if (isPreviewImageSupportEnabled) {
    const previewImageMap = await getPreviewImageMap(recordMap)
    ;(recordMap as any).preview_images = previewImageMap
  }

  await getTweetsMap(recordMap)

  pageCache.set(pageId, recordMap)
  return recordMap
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return fetchWithRetry(() => notion.search(params))
}
