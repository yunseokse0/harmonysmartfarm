import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserById } from '../services/auth';
import { getApiKeyByHash, checkApiKeyQuota, updateApiKeyUsage } from '../services/auth';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    username: string;
    role: string;
  };
  apiKey?: {
    id: number;
    owner_id: number;
    name: string;
    scopes: string[];
  };
}

// JWT Authentication Middleware
export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is required' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
}

// API Key Authentication Middleware
export async function authenticateAPIKey(req: AuthRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  const { hashApiKey } = await import('../services/auth');
  const keyHash = hashApiKey(apiKey);
  const apiKeyData = await getApiKeyByHash(keyHash);

  if (!apiKeyData) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Check quota
  const hasQuota = await checkApiKeyQuota(keyHash);
  if (!hasQuota) {
    return res.status(429).json({ error: 'API key quota exceeded' });
  }

  // Update usage
  await updateApiKeyUsage(keyHash);

  req.apiKey = {
    id: apiKeyData.id,
    owner_id: apiKeyData.owner_id,
    name: apiKeyData.name,
    scopes: apiKeyData.scopes || [],
  };

  next();
}

// Role-based Authorization Middleware
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
}

// Optional Authentication (works with or without auth)
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;

  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  } else if (apiKey) {
    // Try API key authentication
    authenticateAPIKey(req, res, () => {
      // Continue even if API key auth fails
      next();
    });
    return;
  }

  next();
}

