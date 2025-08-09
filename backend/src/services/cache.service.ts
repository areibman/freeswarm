import db from '../config/database';

export class CacheService {
  private memoryCache: Map<string, { data: any; expiresAt: Date }> = new Map();

  // Get from cache
  async get(key: string): Promise<any | null> {
    // Check memory cache first
    const memCached = this.memoryCache.get(key);
    if (memCached && memCached.expiresAt > new Date()) {
      return memCached.data;
    }

    // Check database cache
    return new Promise((resolve) => {
      db.get(
        'SELECT data FROM cache WHERE key = ? AND expires_at > datetime("now")',
        [key],
        (err, row: any) => {
          if (err || !row) {
            resolve(null);
          } else {
            const data = JSON.parse(row.data);
            // Update memory cache
            this.memoryCache.set(key, {
              data,
              expiresAt: new Date(Date.now() + 60000), // 1 minute memory cache
            });
            resolve(data);
          }
        }
      );
    });
  }

  // Set cache value
  async set(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // Update memory cache
    this.memoryCache.set(key, { data, expiresAt });

    // Update database cache
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO cache (key, data, expires_at) VALUES (?, ?, ?)',
        [key, JSON.stringify(data), expiresAt.toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Delete cache entry
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM cache WHERE key = ?', [key], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Clear cache entries matching pattern
  async clear(pattern: string): Promise<void> {
    // Clear memory cache
    if (pattern === '*') {
      this.memoryCache.clear();
    } else {
      const regex = new RegExp('^' + pattern.replace('*', '.*'));
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }
    }

    // Clear database cache
    return new Promise((resolve, reject) => {
      if (pattern === '*') {
        db.run('DELETE FROM cache', (err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        db.run('DELETE FROM cache WHERE key LIKE ?', [pattern.replace('*', '%')], (err) => {
          if (err) reject(err);
          else resolve();
        });
      }
    });
  }

  // Clean expired cache entries
  async cleanExpired(): Promise<void> {
    // Clean memory cache
    const now = new Date();
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }

    // Clean database cache
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM cache WHERE expires_at <= datetime("now")', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Get cache statistics
  getStats(): { memoryEntries: number; memorySize: number } {
    let memorySize = 0;
    for (const value of this.memoryCache.values()) {
      memorySize += JSON.stringify(value.data).length;
    }

    return {
      memoryEntries: this.memoryCache.size,
      memorySize,
    };
  }
}