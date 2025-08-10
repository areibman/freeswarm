import { Adapter, AdapterUser, AdapterSession, AdapterAccount } from 'next-auth/adapters'
import sqlite3 from 'sqlite3'
import path from 'path'

// Extend the default types to include our custom fields
declare module 'next-auth' {
  interface Session {
    accessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      githubId?: string
    }
  }
  
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    githubId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    githubId?: string
  }
}

export class CustomSQLiteAdapter implements Adapter {
  private db: sqlite3.Database

  constructor() {
    const dbPath = path.join(process.cwd(), 'data', 'auth.sqlite')
    this.db = new sqlite3.Database(dbPath)
    this.initDatabase()
  }

  private initDatabase() {
    this.db.serialize(() => {
      // Users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT,
          emailVerified DATETIME,
          image TEXT,
          github_id TEXT UNIQUE
        )
      `)

      // Accounts table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          type TEXT NOT NULL,
          provider TEXT NOT NULL,
          providerAccountId TEXT NOT NULL,
          refresh_token TEXT,
          access_token TEXT,
          expires_at INTEGER,
          token_type TEXT,
          scope TEXT,
          id_token TEXT,
          session_state TEXT,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `)

      // Sessions table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          sessionToken TEXT UNIQUE NOT NULL,
          userId TEXT NOT NULL,
          expires DATETIME NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        )
      `)

      // Verification tokens table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS verification_tokens (
          identifier TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires DATETIME NOT NULL,
          PRIMARY KEY (identifier, token)
        )
      `)
    })
  }

  async createUser(user: Omit<AdapterUser, 'id'>): Promise<AdapterUser> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID()
      const { name, email, image } = user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const github_id = (user as any).github_id
      
      this.db.run(
        `INSERT INTO users (id, name, email, image, github_id) VALUES (?, ?, ?, ?, ?)`,
        [id, name, email, image, github_id],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve({ id, name, email, image, emailVerified: null, github_id } as AdapterUser)
          }
        }
      )
    })
  }

  async getUser(id: string): Promise<AdapterUser | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM users WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row ? row as AdapterUser : null)
          }
        }
      )
    })
  }

  async getUserByEmail(email: string): Promise<AdapterUser | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM users WHERE email = ?`,
        [email],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row ? row as AdapterUser : null)
          }
        }
      )
    })
  }

  async getUserByAccount(providerAccountId: { provider: string; providerAccountId: string }): Promise<AdapterUser | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT u.* FROM users u
         INNER JOIN accounts a ON u.id = a.userId
         WHERE a.provider = ? AND a.providerAccountId = ?`,
        [providerAccountId.provider, providerAccountId.providerAccountId],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row ? row as AdapterUser : null)
          }
        }
      )
    })
  }

  async updateUser(user: Partial<AdapterUser> & { id: string }): Promise<AdapterUser> {
    return new Promise((resolve, reject) => {
      const { id, name, email, image } = user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const github_id = (user as any).github_id
      
      this.db.run(
        `UPDATE users SET name = ?, email = ?, image = ?, github_id = ? WHERE id = ?`,
        [name, email, image, github_id, id],
        (err) => {
          if (err) {
            reject(err)
          } else {
            this.getUser(id).then((user) => {
              if (user) {
                resolve(user)
              } else {
                reject(new Error('User not found after update'))
              }
            }).catch(reject)
          }
        }
      )
    })
  }

  async deleteUser(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM users WHERE id = ?`, [userId], (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async linkAccount(account: AdapterAccount): Promise<void> {
    return new Promise((resolve, reject) => {
      const {
        id,
        userId,
        type,
        provider,
        providerAccountId,
        refresh_token,
        access_token,
        expires_at,
        token_type,
        scope,
        id_token,
        session_state,
      } = account

      this.db.run(
        `INSERT INTO accounts (
          id, userId, type, provider, providerAccountId, refresh_token,
          access_token, expires_at, token_type, scope, id_token, session_state
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          userId,
          type,
          provider,
          providerAccountId,
          refresh_token,
          access_token,
          expires_at,
          token_type,
          scope,
          id_token,
          session_state,
        ],
        (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
  }

  async unlinkAccount(providerAccountId: { provider: string; providerAccountId: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM accounts WHERE provider = ? AND providerAccountId = ?`,
        [providerAccountId.provider, providerAccountId.providerAccountId],
        (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
  }

  async createSession(session: Omit<AdapterSession, 'id'>): Promise<AdapterSession> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID()
      const { sessionToken, userId, expires } = session

      this.db.run(
        `INSERT INTO sessions (id, sessionToken, userId, expires) VALUES (?, ?, ?, ?)`,
        [id, sessionToken, userId, expires],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve({ sessionToken, userId, expires })
          }
        }
      )
    })
  }

  async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT s.*, u.* FROM sessions s
         INNER JOIN users u ON s.userId = u.id
         WHERE s.sessionToken = ?`,
        [sessionToken],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err, row: any) => {
          if (err) {
            reject(err)
          } else if (!row) {
            resolve(null)
          } else {
            const session: AdapterSession = {
              sessionToken: row.sessionToken,
              userId: row.userId,
              expires: row.expires,
            }
            const user: AdapterUser = {
              id: row.userId,
              name: row.name,
              email: row.email,
              image: row.image,
              emailVerified: row.emailVerified,
            }
            resolve({ session, user })
          }
        }
      )
    })
  }

  async updateSession(session: Partial<AdapterSession> & { sessionToken: string }): Promise<AdapterSession | null> {
    return new Promise((resolve, reject) => {
      const { sessionToken, userId, expires } = session

      this.db.run(
        `UPDATE sessions SET userId = ?, expires = ? WHERE sessionToken = ?`,
        [userId, expires, sessionToken],
        (err) => {
          if (err) {
            reject(err)
          } else {
            this.getSessionAndUser(sessionToken).then(result => {
              resolve(result?.session || null)
            }).catch(reject)
          }
        }
      )
    })
  }

  async deleteSession(sessionToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM sessions WHERE sessionToken = ?`, [sessionToken], (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async createVerificationToken(verificationToken: { identifier: string; token: string; expires: Date }): Promise<{ identifier: string; token: string; expires: Date }> {
    return new Promise((resolve, reject) => {
      const { identifier, token, expires } = verificationToken

      this.db.run(
        `INSERT INTO verification_tokens (identifier, token, expires) VALUES (?, ?, ?)`,
        [identifier, token, expires],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve({ identifier, token, expires })
          }
        }
      )
    })
  }

  async useVerificationToken(params: { identifier: string; token: string }): Promise<{ identifier: string; token: string; expires: Date } | null> {
    return new Promise((resolve, reject) => {
      const { identifier, token } = params

      this.db.get(
        `SELECT * FROM verification_tokens WHERE identifier = ? AND token = ?`,
        [identifier, token],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err, row: any) => {
          if (err) {
            reject(err)
          } else if (!row) {
            resolve(null)
          } else {
            this.db.run(
              `DELETE FROM verification_tokens WHERE identifier = ? AND token = ?`,
              [identifier, token],
              (deleteErr) => {
                if (deleteErr) {
                  reject(deleteErr)
                } else {
                  resolve({
                    identifier: row.identifier,
                    token: row.token,
                    expires: row.expires,
                  })
                }
              }
            )
          }
        }
      )
    })
  }
}