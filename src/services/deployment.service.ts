import { PullRequest } from '@/types/github'

export interface DeploymentConfig {
  baseUrl: string
  maxConcurrentDeployments: number
  deploymentTimeout: number
}

export interface DeploymentStatus {
  id: string
  branchName: string
  status: 'pending' | 'deploying' | 'ready' | 'failed' | 'stopped'
  url?: string
  createdAt: string
  updatedAt: string
  error?: string
}

export class DeploymentService {
  private config: DeploymentConfig
  private deployments: Map<string, DeploymentStatus> = new Map()
  private deploymentQueue: string[] = []

  constructor(config: DeploymentConfig) {
    this.config = config
  }

  /**
   * Deploy a specific branch to a VM and return the preview URL
   */
  async deployBranch(pr: PullRequest): Promise<string> {
    const deploymentId = `deploy-${pr.branchName}-${Date.now()}`
    
    // Check if deployment already exists for this branch
    const existingDeployment = this.getDeploymentByBranch(pr.branchName)
    if (existingDeployment && existingDeployment.status === 'ready') {
      return existingDeployment.url!
    }

    // Create new deployment
    const deployment: DeploymentStatus = {
      id: deploymentId,
      branchName: pr.branchName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.deployments.set(deploymentId, deployment)
    this.deploymentQueue.push(deploymentId)

    // Process deployment queue
    await this.processDeploymentQueue()

    // Wait for deployment to complete
    return this.waitForDeployment(deploymentId)
  }

  /**
   * Stop deployment for a specific branch
   */
  async stopDeployment(branchName: string): Promise<void> {
    const deployment = this.getDeploymentByBranch(branchName)
    if (deployment) {
      deployment.status = 'stopped'
      deployment.updatedAt = new Date().toISOString()
      
      // Remove from queue if pending
      const queueIndex = this.deploymentQueue.indexOf(deployment.id)
      if (queueIndex > -1) {
        this.deploymentQueue.splice(queueIndex, 1)
      }
    }
  }

  /**
   * Get deployment status for a branch
   */
  getDeploymentByBranch(branchName: string): DeploymentStatus | undefined {
    for (const deployment of this.deployments.values()) {
      if (deployment.branchName === branchName) {
        return deployment
      }
    }
    return undefined
  }

  /**
   * Get all active deployments
   */
  getAllDeployments(): DeploymentStatus[] {
    return Array.from(this.deployments.values())
  }

  /**
   * Process the deployment queue
   */
  private async processDeploymentQueue(): Promise<void> {
    const activeDeployments = Array.from(this.deployments.values())
      .filter(d => d.status === 'deploying')
      .length

    if (activeDeployments >= this.config.maxConcurrentDeployments) {
      return
    }

    const nextDeploymentId = this.deploymentQueue.shift()
    if (!nextDeploymentId) {
      return
    }

    const deployment = this.deployments.get(nextDeploymentId)
    if (!deployment) {
      return
    }

    // Start deployment
    deployment.status = 'deploying'
    deployment.updatedAt = new Date().toISOString()

    try {
      // Simulate VM deployment process
      await this.simulateVMDeployment(deployment)
      
      // Generate preview URL
      const previewUrl = `${this.config.baseUrl}/preview/${deployment.branchName}`
      
      deployment.status = 'ready'
      deployment.url = previewUrl
      deployment.updatedAt = new Date().toISOString()
      
      // Process next deployment in queue
      setTimeout(() => this.processDeploymentQueue(), 1000)
      
    } catch (error) {
      deployment.status = 'failed'
      deployment.error = error instanceof Error ? error.message : 'Deployment failed'
      deployment.updatedAt = new Date().toISOString()
      
      // Process next deployment in queue
      setTimeout(() => this.processDeploymentQueue(), 1000)
    }
  }

  /**
   * Wait for deployment to complete
   */
  private async waitForDeployment(deploymentId: string): Promise<string> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < this.config.deploymentTimeout) {
      const deployment = this.deployments.get(deploymentId)
      
      if (!deployment) {
        throw new Error('Deployment not found')
      }
      
      if (deployment.status === 'ready' && deployment.url) {
        return deployment.url
      }
      
      if (deployment.status === 'failed') {
        throw new Error(deployment.error || 'Deployment failed')
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    throw new Error('Deployment timeout')
  }

  /**
   * Simulate VM deployment process
   */
  private async simulateVMDeployment(deployment: DeploymentStatus): Promise<void> {
    // Simulate different deployment times based on branch name
    const deploymentTime = Math.random() * 5000 + 2000 // 2-7 seconds
    
    await new Promise(resolve => setTimeout(resolve, deploymentTime))
    
    // Simulate occasional failures
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('VM deployment failed - insufficient resources')
    }
  }

  /**
   * Clean up old deployments
   */
  cleanupOldDeployments(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 hours default
    const now = Date.now()
    
    for (const [id, deployment] of this.deployments.entries()) {
      const deploymentAge = now - new Date(deployment.createdAt).getTime()
      
      if (deploymentAge > maxAge) {
        this.deployments.delete(id)
        
        // Remove from queue if present
        const queueIndex = this.deploymentQueue.indexOf(id)
        if (queueIndex > -1) {
          this.deploymentQueue.splice(queueIndex, 1)
        }
      }
    }
  }
}

// Default deployment configuration
export const defaultDeploymentConfig: DeploymentConfig = {
  baseUrl: process.env.NEXT_PUBLIC_DEPLOYMENT_BASE_URL || 'https://preview.freeswarm.dev',
  maxConcurrentDeployments: 3,
  deploymentTimeout: 60000 // 60 seconds
}

// Singleton instance
export const deploymentService = new DeploymentService(defaultDeploymentConfig)