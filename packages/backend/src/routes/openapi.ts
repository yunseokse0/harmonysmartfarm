import { Router, Request, Response } from 'express';
import { getPool, isDbAvailable } from '../services/database';
import { createApiKey, getApiKeysByOwner, deactivateApiKey, deleteApiKey, logAuditEvent } from '../services/auth';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

export const openapiRouter = Router();

// Apply for OPEN API access
openapiRouter.post('/apply', async (req: Request, res: Response) => {
  try {
    const { organization, email, purpose, description, phone, expected_usage, data_types, agreement } = req.body;

    if (!organization || !email || !purpose) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!agreement) {
      return res.status(400).json({ error: 'You must agree to the terms and conditions' });
    }

    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Save application to database
    const result = await pool.query(
      `INSERT INTO openapi_applications (organization, email, purpose, description, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [organization, email, purpose, description || null]
    );

    await logAuditEvent(null, 'openapi_application_submitted', 'openapi_application', result.rows[0].id, {
      organization,
      email,
      purpose,
    }, req.ip);

    res.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: `APP-${result.rows[0].id}`,
      status: 'pending',
      note: 'Your application will be reviewed by an administrator',
    });
  } catch (error) {
    console.error('Error processing OPEN API application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get API Keys (requires authentication)
openapiRouter.get('/keys', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const apiKeys = await getApiKeysByOwner(userId);
    res.json(apiKeys);
  } catch (error) {
    console.error('Error getting API keys:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

// Create API Key (requires authentication)
openapiRouter.post('/keys', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, scopes = [] } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    const result = await createApiKey(userId, name, scopes);
    if (!result) {
      return res.status(500).json({ error: 'Failed to create API key' });
    }

    await logAuditEvent(userId, 'api_key_created', 'api_key', result.apiKey.id, { name }, req.ip);

    res.status(201).json({
      key: result.key, // Only returned once!
      apiKey: {
        id: result.apiKey.id,
        name: result.apiKey.name,
        scopes: result.apiKey.scopes,
        status: result.apiKey.status,
        quota_daily: result.apiKey.quota_daily,
        quota_used: result.apiKey.quota_used,
        created_at: result.apiKey.created_at,
        last_used_at: result.apiKey.last_used_at,
      },
      warning: 'Save this key now. It will not be shown again.',
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Deactivate API Key
openapiRouter.post('/keys/:id/deactivate', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const keyId = parseInt(req.params.id);
    const success = await deactivateApiKey(keyId, userId);

    if (!success) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await logAuditEvent(userId, 'api_key_deactivated', 'api_key', keyId, {}, req.ip);

    res.json({ message: 'API key deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating API key:', error);
    res.status(500).json({ error: 'Failed to deactivate API key' });
  }
});

// Delete API Key
openapiRouter.delete('/keys/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const keyId = parseInt(req.params.id);
    const success = await deleteApiKey(keyId, userId);

    if (!success) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await logAuditEvent(userId, 'api_key_deleted', 'api_key', keyId, {}, req.ip);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Get API key status
openapiRouter.get('/status', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const apiKeys = await getApiKeysByOwner(userId);
    const activeKeys = apiKeys.filter((k: any) => k.status === 'active');

    res.json({
      hasApiKey: activeKeys.length > 0,
      status: activeKeys.length > 0 ? 'active' : 'no_keys',
      keyCount: apiKeys.length,
      activeKeyCount: activeKeys.length,
      message: activeKeys.length > 0
        ? `You have ${activeKeys.length} active API key(s)`
        : 'No API key found. Please create one.',
    });
  } catch (error) {
    console.error('Error checking API key status:', error);
    res.status(500).json({ error: 'Failed to check API key status' });
  }
});

// Get API documentation
openapiRouter.get('/docs', async (req, res) => {
  try {
    res.json({
      title: 'SmartFarm OPEN API Documentation',
      version: '1.0.0',
      baseUrl: 'https://api.smartfarm.example.com/v1',
      endpoints: [
        {
          path: '/sensors',
          method: 'GET',
          description: 'Get sensor data',
          authentication: 'API Key required',
        },
        {
          path: '/actuators',
          method: 'GET',
          description: 'Get actuator status',
          authentication: 'API Key required',
        },
        {
          path: '/data/export',
          method: 'POST',
          description: 'Export data in specified format',
          authentication: 'API Key required',
        },
      ],
      rateLimit: '1000 requests per hour',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch API documentation' });
  }
});

