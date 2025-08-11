# Branch-Specific VM Deployment Feature

## Overview
This feature enables branch-specific VM deployment for pull requests, ensuring that each branch gets its own isolated preview environment.

## Problem Solved
Previously, clicking "Preview" would trigger VM deployments that affected all branches, causing conflicts when trying to launch VMs for new branches. This update ensures:
- **1 Branch = 1 VM**: Each branch gets its own dedicated preview environment
- **Isolated Deployments**: Deployments are specific to the branch that triggered them
- **No Cross-Branch Interference**: Actions on one branch don't affect others

## How It Works

### Frontend (PullRequestCard Component)
1. **Deploy Button**: When clicking "Preview" for a branch without a deployment, a "Deploy Preview" button appears
2. **Deployment States**: The UI shows real-time status:
   - `idle`: No deployment exists
   - `deploying`: VM is being provisioned (with loading spinner)
   - `deployed`: VM is ready (with preview URL)
   - `failed`: Deployment failed (with error message and retry option)
3. **Prevention of Duplicate Deployments**: The system prevents multiple deployments for the same branch

### Backend API Endpoints
- **POST** `/api/repos/:owner/:repo/pull-requests/:prNumber/deploy`
  - Deploys a VM for a specific pull request branch
  - Returns deployment ID and status
  - Prevents duplicate deployments

- **GET** `/api/repos/:owner/:repo/pull-requests/:prNumber/deployment`
  - Gets the current deployment status for a pull request
  - Returns deployment details including preview URL

### Database Schema
A new `deployments` table tracks:
- `id`: Unique deployment identifier
- `pr_id`: Associated pull request ID
- `branch_name`: The branch being deployed
- `status`: Current deployment status
- `preview_url`: The preview environment URL
- `error_message`: Any error details
- `created_at` & `updated_at`: Timestamps

### WebSocket Updates
Real-time deployment status updates are broadcast via WebSocket:
```javascript
{
  type: 'deployment:update',
  prNumber: '123',
  branchName: 'feature-branch',
  repository: 'owner/repo',
  status: 'deploying' | 'deployed' | 'failed',
  previewUrl?: 'https://preview-123.repo.example.com',
  error?: 'Error message if failed'
}
```

## Usage

### Deploying a Preview
1. Open a pull request card
2. Click the "Preview" button
3. Click "Deploy Preview for [branch-name]"
4. Wait for deployment to complete (typically 5-10 seconds in simulation)
5. Once deployed, the preview URL will be displayed

### Checking Deployment Status
The Preview button shows a checkmark (✓) when a deployment is active for that branch.

### Redeploying
If a preview already exists, you can click "Redeploy Preview" to update the deployment.

## Configuration

### Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:3001`)

### Customization
To integrate with your actual VM provisioning service, modify the deployment logic in:
`backend/src/controllers/pullRequests.controller.ts` - `deployPreview` method

Replace the simulated deployment with your actual VM provisioning API calls.

## Error Handling
- **409 Conflict**: Returned when a deployment is already in progress
- **400 Bad Request**: Missing required branch name
- **500 Internal Server Error**: Deployment service failure

## Future Enhancements
- [ ] Add deployment logs streaming
- [ ] Implement deployment cancellation
- [ ] Add deployment history view
- [ ] Support for multiple deployment environments (staging, production)
- [ ] Auto-cleanup of old deployments
- [ ] Cost tracking per deployment