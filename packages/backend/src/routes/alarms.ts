import { Router } from 'express';
import { pool } from '../services/database';

export const alarmRouter = Router();

// Get all alarms
alarmRouter.get('/', async (req, res) => {
  try {
    const { status, severity, limit = 100 } = req.query;
    let query = 'SELECT a.*, s.name as sensor_name FROM alarms a LEFT JOIN sensors s ON a.sensor_id = s.id';
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`a.status = $${paramIndex++}`);
      values.push(status);
    }

    if (severity) {
      conditions.push(`a.severity = $${paramIndex++}`);
      values.push(severity);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.created_at DESC LIMIT $' + paramIndex;
    values.push(limit);

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alarms' });
  }
});

// Get alarm by ID
alarmRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT a.*, s.name as sensor_name FROM alarms a LEFT JOIN sensors s ON a.sensor_id = s.id WHERE a.id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alarm not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alarm' });
  }
});

// Mark alarm as read
alarmRouter.post('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE alarms SET status = $1 WHERE id = $2 RETURNING *',
      ['read', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alarm not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark alarm as read' });
  }
});

// Resolve alarm
alarmRouter.post('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE alarms SET status = $1, resolved_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['resolved', id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alarm not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve alarm' });
  }
});

// Get alarm statistics
alarmRouter.get('/stats/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        severity,
        status,
        COUNT(*) as count
      FROM alarms
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY severity, status
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alarm statistics' });
  }
});

