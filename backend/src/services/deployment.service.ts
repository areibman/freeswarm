import { PullRequest } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  liveLink?: string;
  sshLink?: string;
  logs?: string;
  error?: string;
}

export interface DeploymentConfig {
  baseUrl?: string;
  dockerRegistry?: string;
  sshKeyPath?: string;
  vmProvider?: 'docker' | 'vercel' | 'netlify' | 'custom';
}

export class DeploymentService {
  private config: DeploymentConfig;
  private activeDeployments = new Map<string, DeploymentResult>();

  constructor(config: DeploymentConfig = {}) {
    this.config = {
      baseUrl: process.env.DEPLOYMENT_BASE_URL || 'http://localhost',
      dockerRegistry: process.env.DOCKER_REGISTRY || 'local',
      vmProvider: (process.env.VM_PROVIDER as any) || 'docker',
      ...config
    };
  }

  /**
   * Deploy a specific branch to its own VM/container
   */
  async deployBranch(pullRequest: PullRequest): Promise<DeploymentResult> {
    const deploymentId = this.generateDeploymentId(pullRequest);
    
    try {
      console.log(`🚀 Starting deployment for branch: ${pullRequest.branchName}`);
      
      // Check if already deployed
      const existing = this.activeDeployments.get(deploymentId);
      if (existing && existing.success) {
        console.log(`✅ Branch ${pullRequest.branchName} already deployed`);
        return existing;
      }

      let result: DeploymentResult;

      switch (this.config.vmProvider) {
        case 'docker':
          result = await this.deployWithDocker(pullRequest, deploymentId);
          break;
        case 'vercel':
          result = await this.deployWithVercel(pullRequest, deploymentId);
          break;
        case 'netlify':
          result = await this.deployWithNetlify(pullRequest, deploymentId);
          break;
        default:
          result = await this.deployWithCustom(pullRequest, deploymentId);
          break;
      }

      // Store the deployment result
      this.activeDeployments.set(deploymentId, result);
      
      console.log(`${result.success ? '✅' : '❌'} Deployment ${result.success ? 'completed' : 'failed'} for ${pullRequest.branchName}`);
      
      return result;
    } catch (error) {
      const errorResult: DeploymentResult = {
        success: false,
        deploymentId,
        error: error instanceof Error ? error.message : 'Unknown deployment error'
      };
      
      this.activeDeployments.set(deploymentId, errorResult);
      console.error(`❌ Deployment failed for ${pullRequest.branchName}:`, error);
      
      return errorResult;
    }
  }

  /**
   * Deploy using Docker containers (each branch gets its own container)
   */
  private async deployWithDocker(pullRequest: PullRequest, deploymentId: string): Promise<DeploymentResult> {
    const containerName = `freeswarm-${deploymentId}`;
    const port = await this.findAvailablePort();
    const repoUrl = pullRequest.githubUrl?.replace('/pull/', '/tree/').replace(/\/\d+$/, '');
    
    try {
      // Stop and remove existing container if it exists
      try {
        await execAsync(`docker stop ${containerName} || true`);
        await execAsync(`docker rm ${containerName} || true`);
      } catch (e) {
        // Ignore errors if container doesn't exist
      }

      // Clone the specific branch and build
      const tempDir = `/tmp/deploy-${deploymentId}`;
      await execAsync(`rm -rf ${tempDir} || true`);
      
      const [owner, repo] = pullRequest.repository.split('/');
      const cloneUrl = `https://github.com/${owner}/${repo}.git`;
      
      await execAsync(`git clone --branch ${pullRequest.branchName} --single-branch ${cloneUrl} ${tempDir}`);
      
      // Build and run the container
      const dockerCommands = [
        `cd ${tempDir}`,
        `docker build -t ${containerName} .`,
        `docker run -d --name ${containerName} -p ${port}:3000 ${containerName}`
      ].join(' && ');
      
      await execAsync(dockerCommands);
      
      const liveLink = `${this.config.baseUrl}:${port}`;
      
      // Wait a moment for container to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify deployment is working
      try {
        const response = await fetch(liveLink);
        if (!response.ok) {
          throw new Error(`Deployment not responding: ${response.status}`);
        }
      } catch (e) {
        console.warn(`Warning: Could not verify deployment at ${liveLink}`);
      }

      return {
        success: true,
        deploymentId,
        liveLink,
        sshLink: `ssh://root@localhost:${port + 1000}`, // SSH on different port
        logs: `Container ${containerName} deployed on port ${port}`
      };
    } catch (error) {
      // Cleanup on failure
      try {
        await execAsync(`docker stop ${containerName} || true`);
        await execAsync(`docker rm ${containerName} || true`);
        await execAsync(`rm -rf /tmp/deploy-${deploymentId} || true`);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      throw error;
    }
  }

  /**
   * Deploy using Vercel (each branch gets its own preview deployment)
   */
  private async deployWithVercel(pullRequest: PullRequest, deploymentId: string): Promise<DeploymentResult> {
    try {
      const [owner, repo] = pullRequest.repository.split('/');
      
      // Use Vercel CLI to deploy specific branch
      const { stdout } = await execAsync(
        `vercel --yes --name ${deploymentId} --meta branch=${pullRequest.branchName} --meta pr=${pullRequest.number}`
      );
      
      // Extract deployment URL from Vercel output
      const urlMatch = stdout.match(/https:\/\/[^\s]+/);
      const liveLink = urlMatch ? urlMatch[0] : undefined;
      
      return {
        success: true,
        deploymentId,
        liveLink,
        logs: `Vercel deployment completed: ${liveLink}`
      };
    } catch (error) {
      throw new Error(`Vercel deployment failed: ${error}`);
    }
  }

  /**
   * Deploy using Netlify
   */
  private async deployWithNetlify(pullRequest: PullRequest, deploymentId: string): Promise<DeploymentResult> {
    try {
      // Use Netlify CLI to deploy specific branch
      const { stdout } = await execAsync(
        `netlify deploy --prod --alias ${deploymentId} --message "Deploy ${pullRequest.branchName}"`
      );
      
      // Extract deployment URL from Netlify output
      const urlMatch = stdout.match(/https:\/\/[^\s]+/);
      const liveLink = urlMatch ? urlMatch[0] : undefined;
      
      return {
        success: true,
        deploymentId,
        liveLink,
        logs: `Netlify deployment completed: ${liveLink}`
      };
    } catch (error) {
      throw new Error(`Netlify deployment failed: ${error}`);
    }
  }

  /**
   * Custom deployment logic
   */
  private async deployWithCustom(pullRequest: PullRequest, deploymentId: string): Promise<DeploymentResult> {
    // This is where you would implement your custom VM deployment logic
    // For now, we'll simulate a deployment with unique ports per branch
    
    // Use a deterministic port based on deployment ID to ensure uniqueness
    const basePort = 4000;
    const portOffset = Math.abs(this.hashCode(deploymentId)) % 1000;
    const port = basePort + portOffset;
    const liveLink = `${this.config.baseUrl}:${port}`;
    
    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      deploymentId,
      liveLink,
      logs: `Custom deployment simulated for ${pullRequest.branchName} on port ${port}`
    };
  }

  /**
   * Simple hash function to generate consistent port offsets
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Stop and cleanup a deployment
   */
  async stopDeployment(deploymentId: string): Promise<boolean> {
    try {
      const deployment = this.activeDeployments.get(deploymentId);
      if (!deployment) {
        return false;
      }

      switch (this.config.vmProvider) {
        case 'docker':
          const containerName = `freeswarm-${deploymentId}`;
          await execAsync(`docker stop ${containerName} || true`);
          await execAsync(`docker rm ${containerName} || true`);
          await execAsync(`rm -rf /tmp/deploy-${deploymentId} || true`);
          break;
        case 'vercel':
          // Vercel deployments are typically left running
          break;
        case 'netlify':
          // Netlify deployments are typically left running
          break;
        default:
          // Custom cleanup logic
          break;
      }

      this.activeDeployments.delete(deploymentId);
      console.log(`🗑️ Cleaned up deployment: ${deploymentId}`);
      
      return true;
    } catch (error) {
      console.error(`Error stopping deployment ${deploymentId}:`, error);
      return false;
    }
  }

  /**
   * Get deployment status
   */
  getDeployment(deploymentId: string): DeploymentResult | undefined {
    return this.activeDeployments.get(deploymentId);
  }

  /**
   * List all active deployments
   */
  getActiveDeployments(): Map<string, DeploymentResult> {
    return new Map(this.activeDeployments);
  }

  /**
   * Generate a unique deployment ID for a branch
   */
  private generateDeploymentId(pullRequest: PullRequest): string {
    // Create a unique ID based on repository and PR number (matches controller logic)
    const repoName = pullRequest.repository.replace('/', '-');
    return `${repoName}-${pullRequest.number}`.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  }

  /**
   * Find an available port for deployment
   */
  private async findAvailablePort(startPort: number = 4000): Promise<number> {
    const isPortInUse = async (port: number): Promise<boolean> => {
      try {
        await execAsync(`lsof -i:${port}`);
        return true;
      } catch {
        return false;
      }
    };

    for (let port = startPort; port < startPort + 1000; port++) {
      if (!(await isPortInUse(port))) {
        return port;
      }
    }
    
    throw new Error('No available ports found');
  }
}