import crypto from 'crypto'

export interface PreviewRequest {
  owner: string
  repo: string
  branchName: string
  prNumber: number
}

export class PreviewService {
  private branchKeyToUrl: Map<string, string> = new Map()

  private generateKey(owner: string, repo: string, branchName: string): string {
    return `${owner}/${repo}#${branchName}`
  }

  private sanitizeForSubdomain(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$|_/g, '')
      .slice(0, 63)
  }

  public getOrCreatePreviewUrl(req: PreviewRequest): string {
    const key = this.generateKey(req.owner, req.repo, req.branchName)
    const existing = this.branchKeyToUrl.get(key)
    if (existing) return existing

    // Build a deterministic, branch-specific URL. In real life this would
    // trigger infra provisioning and return the endpoint. Here we simulate.
    const branchSlug = this.sanitizeForSubdomain(req.branchName)
    const repoSlug = this.sanitizeForSubdomain(req.repo)
    const ownerSlug = this.sanitizeForSubdomain(req.owner)

    // Optional salt to avoid collisions when same branch name reused across repos
    const shortHash = crypto
      .createHash('sha1')
      .update(`${ownerSlug}/${repoSlug}:${branchSlug}`)
      .digest('hex')
      .slice(0, 6)

    const baseDomain = process.env.PREVIEW_BASE_DOMAIN || 'preview.local'
    const url = `https://${branchSlug}-${repoSlug}-${ownerSlug}-${shortHash}.${baseDomain}`

    this.branchKeyToUrl.set(key, url)
    return url
  }
}