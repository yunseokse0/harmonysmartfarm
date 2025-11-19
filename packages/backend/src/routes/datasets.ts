import { Router } from 'express';

export const datasetsRouter = Router();

// Get available datasets
datasetsRouter.get('/', async (req, res) => {
  try {
    // Mock datasets - in production, fetch from SmartFarmKorea API or database
    const datasets = [
      {
        id: 1,
        name: '시설원예 데이터셋',
        description: '온실 환경 데이터 및 작물 생육 데이터',
        size: '2.5GB',
        format: 'CSV, JSON',
        updated: '2024-01-15',
        downloadUrl: '/api/datasets/1/download',
      },
      {
        id: 2,
        name: 'AI 경진대회용 이미지셋',
        description: '작물 질병 탐지용 이미지 데이터셋',
        size: '15GB',
        format: 'Images (JPG, PNG)',
        updated: '2024-01-10',
        downloadUrl: '/api/datasets/2/download',
      },
      {
        id: 3,
        name: '기상융복합 서비스 데이터',
        description: '기상 데이터와 농업 데이터 융합',
        size: '500MB',
        format: 'JSON, XML',
        updated: '2024-01-20',
        downloadUrl: '/api/datasets/3/download',
      },
    ];

    res.json(datasets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

// Get dataset by ID
datasetsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Mock dataset detail
    res.json({
      id: parseInt(id),
      name: '시설원예 데이터셋',
      description: '상세 설명...',
      metadata: {
        columns: ['timestamp', 'temperature', 'humidity', 'co2', 'soil_moisture'],
        recordCount: 1000000,
        dateRange: { start: '2023-01-01', end: '2024-01-01' },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
});

// Download dataset (simulated)
datasetsRouter.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    // In production, this would stream the actual file
    res.json({
      message: `Dataset ${id} download initiated`,
      downloadUrl: `https://example.com/datasets/${id}.zip`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate download' });
  }
});

