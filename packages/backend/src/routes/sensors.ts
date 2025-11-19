import { Router } from 'express';
import { getPool, isDbAvailable } from '../services/database';
import { querySensorData } from '../services/influxdb';

export const sensorRouter = Router();

// Get all sensors
sensorRouter.get('/', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      // Return empty array if database is not available
      return res.json([]);
    }
    const result = await pool.query('SELECT * FROM sensors ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sensors:', error);
    res.json([]); // Return empty array on error
  }
});

// Get sensor by ID
sensorRouter.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM sensors WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching sensor:', error);
    res.status(404).json({ error: 'Sensor not found' });
  }
});

// Get sensor data
sensorRouter.get('/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;

    const startTime = start ? new Date(start as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endTime = end ? new Date(end as string) : new Date();

    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      // Return mock data structure
      const data = await querySensorData(id, startTime, endTime);
      return res.json({
        sensor: { id: parseInt(id), name: 'Mock Sensor', type: 'temperature' },
        data,
        startTime,
        endTime,
      });
    }

    // Get sensor info
    const sensorResult = await pool.query('SELECT * FROM sensors WHERE id = $1', [id]);
    if (sensorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }

    const sensor = sensorResult.rows[0];
    const data = await querySensorData(id, startTime, endTime);

    res.json({
      sensor,
      data,
      startTime,
      endTime,
    });
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

// Create sensor
sensorRouter.post('/', async (req, res) => {
  try {
    const pool = getPool();
    if (!isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { 
      name, 
      type, 
      location, 
      unit, 
      description, 
      mqtt_topic, 
      sampling_interval, 
      min_value, 
      max_value, 
      alarm_threshold_min, 
      alarm_threshold_max 
    } = req.body;
    const result = await pool.query(
      `INSERT INTO sensors (
        name, type, location, unit, description, mqtt_topic, 
        sampling_interval, min_value, max_value, 
        alarm_threshold_min, alarm_threshold_max
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        name, type, location, unit, description || null, mqtt_topic || null,
        sampling_interval || 60, min_value || null, max_value || null,
        alarm_threshold_min || null, alarm_threshold_max || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating sensor:', error);
    res.status(500).json({ error: 'Failed to create sensor' });
  }
});

// Update sensor
sensorRouter.put('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { id } = req.params;
    const { 
      name, 
      type, 
      location, 
      unit, 
      description, 
      mqtt_topic, 
      sampling_interval, 
      min_value, 
      max_value, 
      alarm_threshold_min, 
      alarm_threshold_max 
    } = req.body;
    const result = await pool.query(
      `UPDATE sensors SET 
        name = $1, type = $2, location = $3, unit = $4, 
        description = $5, mqtt_topic = $6, sampling_interval = $7,
        min_value = $8, max_value = $9, 
        alarm_threshold_min = $10, alarm_threshold_max = $11
      WHERE id = $12 RETURNING *`,
      [
        name, type, location, unit, description || null, mqtt_topic || null,
        sampling_interval || 60, min_value || null, max_value || null,
        alarm_threshold_min || null, alarm_threshold_max || null, id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update sensor' });
  }
});

// Delete sensor
sensorRouter.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { id } = req.params;
    await pool.query('DELETE FROM sensors WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sensor' });
  }
});

