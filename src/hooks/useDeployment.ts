import { useState, useEffect, useCallback } from 'react'
import { PullRequest } from '@/types/github'
import { deploymentService, DeploymentStatus } from '@/services/deployment.service'

export interface UseDeploymentReturn {
  deployBranch: (pr: PullRequest) => Promise<string>
  stopDeployment: (branchName: string) => Promise<void>
  getDeploymentStatus: (branchName: string) => DeploymentStatus | undefined
  getAllDeployments: () => DeploymentStatus[]
  isDeploying: (branchName: string) => boolean
  isReady: (branchName: string) => boolean
  hasError: (branchName: string) => boolean
  getError: (branchName: string) => string | undefined
}

export function useDeployment(): UseDeploymentReturn {
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([])

  // Update deployments state
  const updateDeployments = useCallback(() => {
    setDeployments(deploymentService.getAllDeployments())
  }, [])

  // Set up polling to update deployment status
  useEffect(() => {
    updateDeployments()
    
    const interval = setInterval(updateDeployments, 1000)
    
    return () => clearInterval(interval)
  }, [updateDeployments])

  // Clean up old deployments periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      deploymentService.cleanupOldDeployments()
      updateDeployments()
    }, 5 * 60 * 1000) // Every 5 minutes
    
    return () => clearInterval(cleanupInterval)
  }, [updateDeployments])

  const deployBranch = useCallback(async (pr: PullRequest): Promise<string> => {
    try {
      const url = await deploymentService.deployBranch(pr)
      updateDeployments()
      return url
    } catch (error) {
      updateDeployments()
      throw error
    }
  }, [updateDeployments])

  const stopDeployment = useCallback(async (branchName: string): Promise<void> => {
    await deploymentService.stopDeployment(branchName)
    updateDeployments()
  }, [updateDeployments])

  const getDeploymentStatus = useCallback((branchName: string): DeploymentStatus | undefined => {
    return deploymentService.getDeploymentByBranch(branchName)
  }, [])

  const getAllDeployments = useCallback((): DeploymentStatus[] => {
    return deployments
  }, [deployments])

  const isDeploying = useCallback((branchName: string): boolean => {
    const deployment = getDeploymentStatus(branchName)
    return deployment?.status === 'pending' || deployment?.status === 'deploying'
  }, [getDeploymentStatus])

  const isReady = useCallback((branchName: string): boolean => {
    const deployment = getDeploymentStatus(branchName)
    return deployment?.status === 'ready' && !!deployment.url
  }, [getDeploymentStatus])

  const hasError = useCallback((branchName: string): boolean => {
    const deployment = getDeploymentStatus(branchName)
    return deployment?.status === 'failed'
  }, [getDeploymentStatus])

  const getError = useCallback((branchName: string): string | undefined => {
    const deployment = getDeploymentStatus(branchName)
    return deployment?.error
  }, [getDeploymentStatus])

  return {
    deployBranch,
    stopDeployment,
    getDeploymentStatus,
    getAllDeployments,
    isDeploying,
    isReady,
    hasError,
    getError
  }
}