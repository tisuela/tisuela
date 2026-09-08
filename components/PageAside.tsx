import { type Block } from 'notion-types'

import { PageSocial } from './PageSocial'

export function PageAside({
  block,
  isBlogPost
}: {
  block: Block
  isBlogPost: boolean
}) {
  if (!block) {
    return null
  }

  if (isBlogPost) {
    return null
  }

  return <PageSocial />
}
