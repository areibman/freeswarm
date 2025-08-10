import { GitHubProvider } from '@/contexts/GitHubContext'
import { PRManager } from '@/components/PRManager'
import { githubConfig } from '@/config/github.config'

export default function AppHome() {
  return (
    <GitHubProvider config={githubConfig}>
      <PRManager />
    </GitHubProvider>
  )
}