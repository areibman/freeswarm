import { Request, Response } from 'express'
import { GitHubService } from '../services/github.service'
import db from '../config/database'

export class AuthController {
  // Get current user info
  async getCurrentUser(req: Request, res: Response) {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '')
      
      if (!accessToken) {
        return res.status(401).json({ error: 'No access token provided' })
      }

      const githubService = new GitHubService(accessToken)
      const user = await githubService.getAuthenticatedUser()
      
      res.json(user)
    } catch (error) {
      console.error('Error fetching current user:', error)
      res.status(500).json({ error: 'Failed to fetch user information' })
    }
  }

  // Get user's repositories
  async getUserRepositories(req: Request, res: Response) {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '')
      
      if (!accessToken) {
        return res.status(401).json({ error: 'No access token provided' })
      }

      const githubService = new GitHubService(accessToken)
      const repos = await githubService.fetchUserRepositories()
      
      res.json(repos)
    } catch (error) {
      console.error('Error fetching user repositories:', error)
      res.status(500).json({ error: 'Failed to fetch repositories' })
    }
  }

  // Save user's selected repositories
  async saveUserRepositories(req: Request, res: Response) {
    try {
      const { userId, repositories } = req.body
      
      if (!userId || !repositories) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // First, clear existing user repositories
      db.run('DELETE FROM user_repositories WHERE user_id = ?', [userId])

      // Then insert the new selections
      const stmt = db.prepare('INSERT INTO user_repositories (user_id, repository_id) VALUES (?, ?)')
      
      for (const repoFullName of repositories) {
        // Get or create repository record
        const [owner, name] = repoFullName.split('/')
        
        db.get('SELECT id FROM repositories WHERE full_name = ?', [repoFullName], (err, row) => {
          if (err) {
            console.error('Error checking repository:', err)
            return
          }
          
          if (!row) {
            // Create repository record
            db.run(
              'INSERT INTO repositories (id, name, full_name, owner) VALUES (?, ?, ?, ?)',
              [crypto.randomUUID(), name, repoFullName, owner],
              function(err) {
                if (err) {
                  console.error('Error creating repository:', err)
                  return
                }
                
                // Link to user
                stmt.run([userId, this.lastID])
              }
            )
          } else {
            // Link existing repository to user
            stmt.run([userId, row.id])
          }
        })
      }
      
      stmt.finalize()
      
      res.json({ success: true, message: 'Repositories saved successfully' })
    } catch (error) {
      console.error('Error saving user repositories:', error)
      res.status(500).json({ error: 'Failed to save repositories' })
    }
  }

  // Get user's saved repositories
  async getUserSavedRepositories(req: Request, res: Response) {
    try {
      const { userId } = req.params
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' })
      }

      db.all(
        `SELECT r.* FROM repositories r
         INNER JOIN user_repositories ur ON r.id = ur.repository_id
         WHERE ur.user_id = ?`,
        [userId],
        (err, rows) => {
          if (err) {
            console.error('Error fetching saved repositories:', err)
            return res.status(500).json({ error: 'Failed to fetch saved repositories' })
          }
          
          res.json(rows || [])
        }
      )
    } catch (error) {
      console.error('Error fetching saved repositories:', error)
      res.status(500).json({ error: 'Failed to fetch saved repositories' })
    }
  }
}