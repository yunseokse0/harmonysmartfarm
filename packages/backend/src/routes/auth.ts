import { Router, Request, Response } from 'express';
import {
  getUserWithPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  createUser,
  logAuditEvent,
} from '../services/auth';
import { getPool, isDbAvailable } from '../services/database';

export const authRouter = Router();

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await getUserWithPassword(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!verifyPassword(password, user.password_hash)) {
      await logAuditEvent(null, 'login_failed', 'user', null, { username }, req.ip);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await logAuditEvent(user.id, 'login_success', 'user', user.id, { username }, req.ip);

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, role = 'user' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const user = await createUser(username, email, password, role);
    if (!user) {
      return res.status(400).json({ error: 'Failed to create user. Username or email may already exist.' });
    }

    await logAuditEvent(user.id, 'user_created', 'user', user.id, { username, email, role }, req.ip);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Refresh Token
authRouter.post('/token/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newToken = generateToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Get Current User
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    // This should be protected by auth middleware
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { getUserById } = await import('../services/auth');
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

