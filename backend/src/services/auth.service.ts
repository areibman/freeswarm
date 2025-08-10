import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database';

export interface User {
  id: number;
  githubId: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
  githubAccessToken: string;
  connectedRepos: Array<{ owner: string; repo: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  githubId: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
  githubAccessToken: string;
}

export class AuthService {
  private db: any;

  constructor() {
    this.db = getDatabase();
    this.initializeUserTable();
  }

  /**
   * Initialize user table if it doesn't exist
   */
  private async initializeUserTable() {
    const createUserTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        github_id TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        name TEXT,
        avatar_url TEXT,
        github_access_token TEXT,
        connected_repos TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createUserTableQuery, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table initialized');
      }
    });
  }

  /**
   * Find or create a user
   */
  async findOrCreateUser(userData: CreateUserDto): Promise<User> {
    return new Promise((resolve, reject) => {
      // First, try to find the user
      this.db.get(
        'SELECT * FROM users WHERE github_id = ?',
        [userData.githubId],
        async (err, row) => {
          if (err) {
            return reject(err);
          }

          if (row) {
            // Update existing user
            this.db.run(
              `UPDATE users 
               SET username = ?, email = ?, name = ?, avatar_url = ?, 
                   github_access_token = ?, updated_at = CURRENT_TIMESTAMP
               WHERE github_id = ?`,
              [
                userData.username,
                userData.email,
                userData.name,
                userData.avatarUrl,
                userData.githubAccessToken,
                userData.githubId,
              ],
              (updateErr) => {
                if (updateErr) {
                  return reject(updateErr);
                }

                // Fetch and return updated user
                this.db.get(
                  'SELECT * FROM users WHERE github_id = ?',
                  [userData.githubId],
                  (fetchErr, updatedRow) => {
                    if (fetchErr) {
                      return reject(fetchErr);
                    }
                    resolve(this.mapRowToUser(updatedRow));
                  }
                );
              }
            );
          } else {
            // Create new user
            this.db.run(
              `INSERT INTO users (github_id, username, email, name, avatar_url, github_access_token)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                userData.githubId,
                userData.username,
                userData.email,
                userData.name,
                userData.avatarUrl,
                userData.githubAccessToken,
              ],
              function (insertErr) {
                if (insertErr) {
                  return reject(insertErr);
                }

                // Fetch and return created user
                this.db.get(
                  'SELECT * FROM users WHERE id = ?',
                  [this.lastID],
                  (fetchErr, newRow) => {
                    if (fetchErr) {
                      return reject(fetchErr);
                    }
                    resolve(this.mapRowToUser(newRow));
                  }
                );
              }.bind(this)
            );
          }
        }
      );
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row ? this.mapRowToUser(row) : null);
        }
      );
    });
  }

  /**
   * Get user by GitHub ID
   */
  async getUserByGitHubId(githubId: string): Promise<User | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE github_id = ?',
        [githubId],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row ? this.mapRowToUser(row) : null);
        }
      );
    });
  }

  /**
   * Connect a repository to user's account
   */
  async connectRepository(userId: number, repo: { owner: string; repo: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT connected_repos FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) {
            return reject(err);
          }

          const connectedRepos = row ? JSON.parse(row.connected_repos || '[]') : [];
          
          // Check if repo already connected
          const exists = connectedRepos.some(
            (r: any) => r.owner === repo.owner && r.repo === repo.repo
          );

          if (!exists) {
            connectedRepos.push(repo);

            this.db.run(
              'UPDATE users SET connected_repos = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [JSON.stringify(connectedRepos), userId],
              (updateErr) => {
                if (updateErr) {
                  return reject(updateErr);
                }
                resolve();
              }
            );
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Disconnect a repository from user's account
   */
  async disconnectRepository(userId: number, repo: { owner: string; repo: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT connected_repos FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) {
            return reject(err);
          }

          const connectedRepos = row ? JSON.parse(row.connected_repos || '[]') : [];
          const filteredRepos = connectedRepos.filter(
            (r: any) => !(r.owner === repo.owner && r.repo === repo.repo)
          );

          this.db.run(
            'UPDATE users SET connected_repos = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [JSON.stringify(filteredRepos), userId],
            (updateErr) => {
              if (updateErr) {
                return reject(updateErr);
              }
              resolve();
            }
          );
        }
      );
    });
  }

  /**
   * Map database row to User object
   */
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      githubId: row.github_id,
      username: row.username,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatar_url,
      githubAccessToken: row.github_access_token,
      connectedRepos: JSON.parse(row.connected_repos || '[]'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}