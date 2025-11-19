import { Router, Request, Response } from 'express';
import { getPool, isDbAvailable } from '../services/database';
import { optionalAuth, AuthRequest } from '../middleware/auth';

export const aiRouter = Router();

// Get all AI jobs
aiRouter.get('/jobs', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.json([]);
    }

    const { status, type } = req.query;
    let query = 'SELECT * FROM ai_jobs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (type) {
      query += ` AND type = $${paramIndex++}`;
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching AI jobs:', error);
    res.status(500).json({ error: 'Failed to fetch AI jobs' });
  }
});

// Get AI job by ID
aiRouter.get('/jobs/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const { id } = req.params;
    const result = await pool.query('SELECT * FROM ai_jobs WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching AI job:', error);
    res.status(500).json({ error: 'Failed to fetch AI job' });
  }
});

// Create AI job
aiRouter.post('/jobs', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const { type, dataset_id, parameters } = req.body;
    const userId = req.user?.userId || null;

    if (!type || !['train', 'inference'].includes(type)) {
      return res.status(400).json({ error: 'Invalid job type. Must be "train" or "inference"' });
    }

    const result = await pool.query(
      `INSERT INTO ai_jobs (type, dataset_id, parameters, created_by, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [type, dataset_id, JSON.stringify(parameters || {}), userId]
    );

    const job = result.rows[0];

    // In production, trigger actual AI job execution here
    // For now, simulate job execution
    setTimeout(async () => {
      try {
        const updatePool = getPool();
        if (updatePool && isDbAvailable()) {
          await updatePool.query(
            'UPDATE ai_jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['running', job.id]
          );
          
          // Simulate completion after 5 seconds
          setTimeout(async () => {
            try {
              const completePool = getPool();
              if (completePool && isDbAvailable()) {
                const mockResult = {
                  accuracy: type === 'train' ? 0.92 : null,
                  loss: type === 'train' ? 0.08 : null,
                  inference_time: type === 'inference' ? 0.15 : null,
                };
                
                await completePool.query(
                  `UPDATE ai_jobs 
                   SET status = $1, result = $2, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                   WHERE id = $3`,
                  ['completed', JSON.stringify(mockResult), job.id]
                );
              }
            } catch (error) {
              console.error('Error completing job:', error);
            }
          }, 5000);
        }
      } catch (error) {
        console.error('Error updating job status:', error);
      }
    }, 1000);

    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating AI job:', error);
    res.status(500).json({ error: 'Failed to create AI job' });
  }
});

// Get AI job status
aiRouter.get('/jobs/:id/status', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, type, status, result, created_at, updated_at, completed_at FROM ai_jobs WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

// Get AI job logs
aiRouter.get('/jobs/:id/logs', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.json({ logs: 'Logs not available' });
    }

    const { id } = req.params;
    const result = await pool.query('SELECT logs FROM ai_jobs WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ logs: result.rows[0].logs || '' });
  } catch (error) {
    console.error('Error fetching job logs:', error);
    res.status(500).json({ error: 'Failed to fetch job logs' });
  }
});

// Get all AI models
aiRouter.get('/models', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.json([]);
    }

    const result = await pool.query(
      'SELECT * FROM ai_models ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
});

// Get AI model by ID
aiRouter.get('/models/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const { id } = req.params;
    const result = await pool.query('SELECT * FROM ai_models WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching AI model:', error);
    res.status(500).json({ error: 'Failed to fetch AI model' });
  }
});

// Legacy AI endpoints (keep for backward compatibility)
aiRouter.post('/analyze-crop', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.json({
    result: 'mock_analysis',
    confidence: 0.85,
    recommendations: ['적절한 관수 필요', '영양제 보충 권장'],
  });
});

aiRouter.post('/detect-disease', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.json({
    detected: true,
    disease: 'late_blight',
    confidence: 0.92,
    severity: 'moderate',
    recommendations: ['살균제 적용 필요', '환기 개선 권장'],
  });
});

aiRouter.post('/predict-irrigation', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.json({
    predictedAmount: 150,
    unit: 'ml',
    recommendedTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  });
});

aiRouter.post('/analyze-trends', optionalAuth, async (req: AuthRequest, res: Response) => {
  res.json({
    trends: [
      { metric: 'temperature', trend: 'increasing', change: 2.5 },
      { metric: 'humidity', trend: 'stable', change: 0.3 },
    ],
  });
});
