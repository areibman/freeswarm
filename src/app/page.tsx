import { GitHubProvider } from '@/contexts/GitHubContext'
import { LandingPage } from '@/components/LandingPage'
import { githubConfig } from '@/config/github.config'

export default function Home() {
  return (
    <GitHubProvider config={githubConfig}>
      <LandingPage />
    </GitHubProvider>
  )
}