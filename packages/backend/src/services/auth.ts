import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getPool, isDbAvailable } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
}

// Generate API Key
export function generateApiKey(): string {
  return `sk_${crypto.randomBytes(32).toString('hex')}`;
}

// Hash API Key
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Generate JWT Token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Generate Refresh Token
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

// Verify JWT Token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Verify Refresh Token
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Hash Password
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Verify Password
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Get User by Username
export async function getUserByUsername(username: string): Promise<User | null> {
  const pool = getPool();
  if (!pool || !isDbAvailable()) {
    return null;
  }
  try {
    const result = await pool.query(
      'SELECT id, username, email, role FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

// Get User by ID
export async function getUserById(id: number): Promise<User | null> {
  const pool = getPool();
  if (!pool || !isDbAvailable()) {
    return null;
  }
  try {
    const result = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
}

// Get User with Password (for login)
export async function getUserWithPassword(username: string): Promise<{ id: number; username: string; email: string; role: string; password_hash: string } | null> {
  const pool = getPool();
  if (!pool || !isDbAvailable()) {
    return null;
  }
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, password_hash FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user with password:', error);
    return null;
  }
}

// Create User
export async function createUser(username: string, email: string, password: string, role: string = 'user'): Promise<User | null> {
  const pool = getPool();
  if (!pool || !isDbAvailable()) {
    return null;
  }
  try {
    const passwordHash = hashPassword(password);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, passwordHash, role]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

// Get API Key by Hash
export async function getApiKeyByHash(keyHash: string): Promise<any | null> {
  const pool = getPool();
  if (!pool || !isDbAvailable()) {
    return null;
  }
  try {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE key_hash = $1 AND status = $2',
      [keyHash, 'active']
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
}

// Create API Key
export async function createApiKey(ownerId: number, name: string, scopes: string[] = []): Promise<{ key: string; apiKey: any } | null> {
  const pool = getPool();
  if (!pool || !isDbAvailable()) {
    return null;
  }
  try {
    const key = generateApiKey();
    const keyHash = hashApiKey(key);
    const quotaResetAt = new Date();
    quotaResetAt.setDate(quotaResetAt.getDate() + 1);
    quotaResetAt.setHours(0, 0, 0, 0);

    const result = await pool.query(
      `INSERT INTO api_keys (owner_id, key_hash, name, scopes, quota_reset_at) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, owner_id, name, scopes, status, quota_daily, quota_used, created_at, last_used_at`,
      [ownerId, keyHash, name, scopes, quotaResetAt]
    );

    return {
      key,
      apiKey: result.rows[0],
    };
  } catch (error) {
    console.error('Error creating API key:', error);
    return null;
  }
}

// Update API Key Usage
export async function updateApiKeyUsage(keyHash: string): Promise<void> {
  const pool = getPool();
  if (!pool || !isDbAvailable()) {
    return;
  }
  try {
    await pool.query(
      'UPDATE api_keys SET quota_used = quota_used + 1, last_used_at = CURRENT_TIMESTAMP WHERE key_hash = $1',
      [keyHash]
    );
  } catch (error) {
    console.error('Error updating API key usage:', error);
  }
}

// Check API Key Quota
export async function checkApiKeyQuota(keyHash: string): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isDbAvailable()) {
    return false;
  }
  try {
    const result = await pool.query(
      'SELECT quota_daily, quota_used, quota_reset_at FROM api_keys WHERE key_hash = $1',
      [keyHash]
    );
    if (result.rows.length === 0) {
      return false;
    }
    const { quota_daily, quota_used, quota_reset_at } = result.rows[0];
    
    // Reset quota if reset time has passed
    if (quota_reset_at && new Date() > new Date(quota_reset_at)) {
      await pool.query(
        'UPDATE api_keys SET quota_used = 0, quota_reset_at = $1 WHERE key_hash = $2',
        [new Date(Date.now() + 24 * 60 * 60 * 1000), keyHash]
      );
      return true;
    }
    
    return quota_used < quota_daily;
  } catch (error) {
    console.error('Error checking API key quota:', error);
    return false;
  }
}

// Get API Keys by Owner
export async function getApiKeysByOwner(ownerId: number): Promise<any[]> {
  const pool = getPool();
  if (!pool || !isDbAvailable()) {
    return [];
  }
  try {
    const result = await pool.query(
      'SELECT id, name, scopes, status, quota_daily, quota_used, created_at, last_used_at FROM api_keys WHERE owner_id = $1 ORDER BY created_at DESC',
      [ownerId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting API keys:', error);
    return [];
  }
}

// Deactivate API Key
export async function deactivateApiKey(keyId: number, ownerId: number): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isDbAvailable()) {
    return false;
  }
  try {
    const result = await pool.query(
      'UPDATE api_keys SET status = $1 WHERE id = $2 AND owner_id = $3',
      ['inactive', keyId, ownerId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Error deactivating API key:', error);
    return false;
  }
}

// Delete API Key
export async function deleteApiKey(keyId: number, ownerId: number): Promise<boolean> {
  const pool = getPool();
  if (!pool || !isDbAvailable()) {
    return false;
  }
  try {
    const result = await pool.query(
      'DELETE FROM api_keys WHERE id = $1 AND owner_id = $2',
      [keyId, ownerId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting API key:', error);
    return false;
  }
}

// Log Audit Event
export async function logAuditEvent(
  actorId: number | null,
  action: string,
  resourceType: string | null,
  resourceId: number | null,
  payload: any,
  ipAddress?: string
): Promise<void> {
  const pool = getPool();
  if (!pool || !isDbAvailable()) {
    return;
  }
  try {
    await pool.query(
      'INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, payload, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
      [actorId, action, resourceType, resourceId, JSON.stringify(payload), ipAddress]
    );
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

