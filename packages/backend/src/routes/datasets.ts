import { Router, Request, Response } from 'express';
import { getPool, isDbAvailable } from '../services/database';
import { optionalAuth, AuthRequest } from '../middleware/auth';

export const datasetsRouter = Router();

// Get available datasets with filtering
datasetsRouter.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { crop_type, data_type, date_from, date_to } = req.query;
    const pool = getPool();
    
    if (!pool || !isDbAvailable()) {
      // Return mock data if DB not available
      const datasets = [
        {
          id: 1,
          title: '시설원예 데이터셋',
          description: '온실 환경 데이터 및 작물 생육 데이터',
          crop_type: 'tomato',
          data_type: 'sensor',
          fields: ['timestamp', 'temperature', 'humidity', 'co2', 'soil_moisture'],
          license: 'CC BY 4.0',
          file_size: 2684354560,
          record_count: 1000000,
          date_range_start: '2023-01-01',
          date_range_end: '2024-01-01',
          created_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 2,
          title: 'AI 경진대회용 이미지셋',
          description: '작물 질병 탐지용 이미지 데이터셋',
          crop_type: 'tomato',
          data_type: 'image',
          fields: ['image_path', 'label', 'bbox'],
          license: 'CC BY-NC 4.0',
          file_size: 16106127360,
          record_count: 50000,
          date_range_start: '2023-06-01',
          date_range_end: '2023-12-31',
          created_at: '2024-01-10T00:00:00Z',
        },
        {
          id: 3,
          title: '기상융복합 서비스 데이터',
          description: '기상 데이터와 농업 데이터 융합',
          crop_type: 'general',
          data_type: 'weather',
          fields: ['timestamp', 'temperature', 'humidity', 'precipitation', 'wind_speed'],
          license: 'CC BY 4.0',
          file_size: 524288000,
          record_count: 100000,
          date_range_start: '2023-01-01',
          date_range_end: '2024-01-01',
          created_at: '2024-01-20T00:00:00Z',
        },
      ];
      return res.json(datasets);
    }

    let query = 'SELECT * FROM datasets WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (crop_type) {
      query += ` AND crop_type = $${paramIndex++}`;
      params.push(crop_type);
    }
    if (data_type) {
      query += ` AND data_type = $${paramIndex++}`;
      params.push(data_type);
    }
    if (date_from) {
      query += ` AND date_range_end >= $${paramIndex++}`;
      params.push(date_from);
    }
    if (date_to) {
      query += ` AND date_range_start <= $${paramIndex++}`;
      params.push(date_to);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

// Get dataset by ID
datasetsRouter.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    if (!pool || !isDbAvailable()) {
      // Return mock data
      return res.json({
        id: parseInt(id),
        title: '시설원예 데이터셋',
        description: '온실 환경 데이터 및 작물 생육 데이터',
        crop_type: 'tomato',
        data_type: 'sensor',
        fields: ['timestamp', 'temperature', 'humidity', 'co2', 'soil_moisture'],
        license: 'CC BY 4.0',
        file_size: 2684354560,
        record_count: 1000000,
        date_range_start: '2023-01-01',
        date_range_end: '2024-01-01',
      });
    }

    const result = await pool.query('SELECT * FROM datasets WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching dataset:', error);
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
});

// Download dataset (presigned URL or streaming)
datasetsRouter.get('/:id/download', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    
    if (!pool || !isDbAvailable()) {
      // Return mock presigned URL
      return res.json({
        downloadUrl: `https://example.com/datasets/${id}.zip?token=mock_token`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        message: 'Download URL generated (mock)',
      });
    }

    const result = await pool.query('SELECT * FROM datasets WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    const dataset = result.rows[0];
    
    // In production, generate presigned URL (S3, Azure Blob, etc.)
    // For now, return a mock URL
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const downloadUrl = dataset.file_url || `https://storage.example.com/datasets/${id}.zip?token=generated_token`;

    res.json({
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      fileSize: dataset.file_size,
      fileName: `${dataset.title.replace(/\s+/g, '_')}.zip`,
    });
  } catch (error) {
    console.error('Error initiating download:', error);
    res.status(500).json({ error: 'Failed to initiate download' });
  }
});

// Create dataset (admin only)
datasetsRouter.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const {
      title,
      description,
      crop_type,
      data_type,
      fields,
      license,
      samples_url,
      file_url,
      file_size,
      record_count,
      date_range_start,
      date_range_end,
    } = req.body;

    const userId = req.user?.userId || null;

    const result = await pool.query(
      `INSERT INTO datasets (
        title, description, crop_type, data_type, fields, license,
        samples_url, file_url, file_size, record_count,
        date_range_start, date_range_end, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        title,
        description,
        crop_type,
        data_type,
        JSON.stringify(fields || []),
        license,
        samples_url,
        file_url,
        file_size,
        record_count,
        date_range_start,
        date_range_end,
        userId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating dataset:', error);
    res.status(500).json({ error: 'Failed to create dataset' });
  }
});

