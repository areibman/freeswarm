import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { PullRequest, WebhookPayload } from '../types';

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, Socket> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, socket);

      // Join repository rooms
      socket.on('subscribe:repository', (repoName: string) => {
        socket.join(`repo:${repoName}`);
        console.log(`Client ${socket.id} subscribed to repository: ${repoName}`);
      });

      socket.on('unsubscribe:repository', (repoName: string) => {
        socket.leave(`repo:${repoName}`);
        console.log(`Client ${socket.id} unsubscribed from repository: ${repoName}`);
      });

      // Join user-specific room
      socket.on('subscribe:user', (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`Client ${socket.id} subscribed to user updates: ${userId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      // Handle PR status updates
      socket.on('pr:update_status', (data: { prId: string; status: string }) => {
        // Broadcast to all clients in the same repository
        this.broadcastPRUpdate(data.prId, { status: data.status as 'draft' | 'open' | 'closed' | 'merged' });
      });
    });
  }

  // Broadcast PR updates to relevant clients
  public broadcastPRUpdate(prId: string, update: Partial<PullRequest>) {
    // Extract repository from PR ID (format: pr-owner/repo-number)
    const match = prId.match(/pr-(.+)-\d+/);
    if (match) {
      const repository = match[1];
      this.io.to(`repo:${repository}`).emit('pr:updated', {
        prId,
        update,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Broadcast new PR creation
  public broadcastNewPR(pr: PullRequest) {
    this.io.to(`repo:${pr.repository}`).emit('pr:created', {
      pullRequest: pr,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast PR deletion
  public broadcastPRDeleted(prId: string, repository: string) {
    this.io.to(`repo:${repository}`).emit('pr:deleted', {
      prId,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle GitHub webhook events
  public handleWebhookEvent(payload: WebhookPayload) {
    const repository = payload.repository?.full_name;
    if (!repository) return;

    switch (payload.action) {
      case 'opened':
      case 'reopened':
      case 'closed':
      case 'merged':
        if (payload.pull_request) {
          this.io.to(`repo:${repository}`).emit('webhook:pr', {
            action: payload.action,
            pullRequest: payload.pull_request,
            timestamp: new Date().toISOString(),
          });
        }
        break;

      case 'created':
      case 'edited':
      case 'deleted':
        if (payload.issue) {
          this.io.to(`repo:${repository}`).emit('webhook:issue', {
            action: payload.action,
            issue: payload.issue,
            timestamp: new Date().toISOString(),
          });
        }
        break;

      default:
        // Broadcast generic webhook event
        this.io.to(`repo:${repository}`).emit('webhook:event', {
          action: payload.action,
          payload,
          timestamp: new Date().toISOString(),
        });
    }
  }

  // Send notification to specific user
  public notifyUser(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  // Get connected clients count
  public getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Broadcast system message to all clients
  public broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.io.emit('system:message', {
      message,
      type,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast deployment updates
  public broadcastDeployment(data: {
    prNumber: string | number;
    branchName: string;
    repository: string;
    status: 'deploying' | 'deployed' | 'failed';
    previewUrl?: string;
    error?: string;
  }) {
    this.io.to(`repo:${data.repository}`).emit('deployment:update', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  // Generic broadcast method
  public broadcast(data: any) {
    this.io.emit('broadcast', data);
  }
}
