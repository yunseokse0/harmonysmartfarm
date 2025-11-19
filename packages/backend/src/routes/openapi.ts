import { Router } from 'express';
import { pool } from '../services/database';

export const openapiRouter = Router();

// Apply for OPEN API access
openapiRouter.post('/apply', async (req, res) => {
  try {
    const { organization, email, purpose, description } = req.body;

    if (!organization || !email || !purpose) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Save application to database
    const result = await pool.query(
      `INSERT INTO openapi_applications (organization, email, purpose, description, status)
       VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
      [organization, email, purpose, description || null]
    );

    console.log('OPEN API Application submitted:', {
      id: result.rows[0].id,
      organization,
      email,
      purpose,
      timestamp: new Date().toISOString(),
    });

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

// Get API key status
openapiRouter.get('/status', async (req, res) => {
  try {
    // In production, check actual API key status from database
    res.json({
      hasApiKey: false,
      status: 'not_applied',
      message: 'No API key found. Please apply for access.',
    });
  } catch (error) {
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

