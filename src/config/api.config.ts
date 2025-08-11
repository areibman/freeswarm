// API Configuration
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  endpoints: {
    deployPreview: (owner: string, repo: string, prNumber: string) => 
      `/api/repos/${owner}/${repo}/pull-requests/${prNumber}/deploy`,
    getDeploymentStatus: (owner: string, repo: string, prNumber: string) => 
      `/api/repos/${owner}/${repo}/pull-requests/${prNumber}/deployment`,
  }
}

export const getApiUrl = (endpoint: string): string => {
  return `${apiConfig.baseUrl}${endpoint}`
}