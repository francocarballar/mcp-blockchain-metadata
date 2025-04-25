import type { Repository, TemplatesRepository } from '../types/repository'
import { REPOSITORY_BASE_URL } from '../constants/url'

let repositoryCache: Repository | null = null
let repositoryCacheExpiry: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getRepository (): Promise<Repository> {
  const now = Date.now()

  if (repositoryCache && now < repositoryCacheExpiry) {
    return repositoryCache
  }

  try {
    const response = await fetch(REPOSITORY_BASE_URL)

    if (!response.ok) {
      throw new Error(`Failed to fetch repository: ${response.statusText}`)
    }

    // Update cache
    const data = (await response.json()) as Repository
    repositoryCache = data
    repositoryCacheExpiry = now + CACHE_TTL

    return data
  } catch (error) {
    console.error('Error fetching repository:', error)
    throw new Error(
      `Failed to fetch repository data: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

export async function getTemplates (): Promise<TemplatesRepository[]> {
  const repository = await getRepository()
  const templatesRepository: TemplatesRepository[] = []

  for (const category of repository.templates) {
    templatesRepository.push(category)
  }

  return templatesRepository
}
