import { Router } from 'express';
import { aiService } from '../services/aiService';

export const aiRouter = Router();

// Analyze crop from image
aiRouter.post('/analyze-crop', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const result = await aiService.analyzeCrop(imageUrl);
    res.json(result);
  } catch (error) {
    console.error('Error analyzing crop:', error);
    res.status(500).json({ error: 'Failed to analyze crop' });
  }
});

// Detect disease from image
aiRouter.post('/detect-disease', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const result = await aiService.detectDisease(imageUrl);
    res.json(result);
  } catch (error) {
    console.error('Error detecting disease:', error);
    res.status(500).json({ error: 'Failed to detect disease' });
  }
});

// Predict irrigation need
aiRouter.post('/predict-irrigation', async (req, res) => {
  try {
    const { soilMoisture, temperature, humidity } = req.body;
    
    if (soilMoisture === undefined) {
      return res.status(400).json({ error: 'soilMoisture is required' });
    }

    const result = await aiService.predictIrrigation(
      soilMoisture,
      temperature || 25,
      humidity || 60
    );
    res.json(result);
  } catch (error) {
    console.error('Error predicting irrigation:', error);
    res.status(500).json({ error: 'Failed to predict irrigation' });
  }
});

// Analyze trends
aiRouter.post('/analyze-trends', async (req, res) => {
  try {
    const { sensorData } = req.body;
    
    if (!Array.isArray(sensorData)) {
      return res.status(400).json({ error: 'sensorData must be an array' });
    }

    const recommendations = await aiService.analyzeTrends(sensorData);
    res.json({ recommendations });
  } catch (error) {
    console.error('Error analyzing trends:', error);
    res.status(500).json({ error: 'Failed to analyze trends' });
  }
});

