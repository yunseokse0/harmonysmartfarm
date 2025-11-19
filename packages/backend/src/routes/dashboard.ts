import { Router } from 'express';
import { pool } from '../services/database';
import { querySensorData } from '../services/influxdb';

export const dashboardRouter = Router();

// Get dashboard summary
dashboardRouter.get('/summary', async (req, res) => {
  try {
    // Get sensor count
    const sensorCount = await pool.query('SELECT COUNT(*) as count FROM sensors');
    
    // Get actuator count
    const actuatorCount = await pool.query('SELECT COUNT(*) as count FROM actuators');
    
    // Get robot count
    const robotCount = await pool.query('SELECT COUNT(*) as count FROM robots');
    
    // Get active rules count
    const activeRulesCount = await pool.query(
      "SELECT COUNT(*) as count FROM rules WHERE enabled = true"
    );
    
    // Get unread alarms count
    const unreadAlarmsCount = await pool.query(
      "SELECT COUNT(*) as count FROM alarms WHERE status = 'unread'"
    );

    // Get recent sensor data (last 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const now = new Date();

    // Get latest sensor values (simplified - in production, query from InfluxDB)
    const sensors = await pool.query('SELECT id, name, type, unit FROM sensors LIMIT 10');

    res.json({
      sensors: {
        total: parseInt(sensorCount.rows[0].count),
        recent: sensors.rows,
      },
      actuators: {
        total: parseInt(actuatorCount.rows[0].count),
      },
      robots: {
        total: parseInt(robotCount.rows[0].count),
      },
      rules: {
        active: parseInt(activeRulesCount.rows[0].count),
      },
      alarms: {
        unread: parseInt(unreadAlarmsCount.rows[0].count),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// Get recent sensor readings
dashboardRouter.get('/sensors/recent', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const sensors = await pool.query(
      'SELECT id, name, type, unit FROM sensors ORDER BY created_at DESC LIMIT $1',
      [limit]
    );

    // For each sensor, get latest data point (simplified)
    // In production, this would query InfluxDB for actual recent values
    const sensorData = sensors.rows.map((sensor) => ({
      ...sensor,
      latestValue: null, // Would be fetched from InfluxDB
      timestamp: null,
    }));

    res.json(sensorData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent sensor readings' });
  }
});

// Get system status
dashboardRouter.get('/status', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    const dbStatus = 'connected';

    // Check MQTT (would need to check mqttService status)
    const mqttStatus = 'connected'; // Simplified

    res.json({
      database: dbStatus,
      mqtt: mqttStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      database: 'disconnected',
      mqtt: 'unknown',
      error: 'Failed to check system status',
    });
  }
});

