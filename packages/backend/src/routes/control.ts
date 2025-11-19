import { Router } from 'express';
import { getPool, isDbAvailable } from '../services/database';
import { mqttService } from '../services/mqtt';
import { websocketService } from '../services/websocket';

export const controlRouter = Router();

// Get all actuators
controlRouter.get('/actuators', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.json([]);
    }
    const result = await pool.query('SELECT * FROM actuators ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch actuators' });
  }
});

// Get actuator by ID
controlRouter.get('/actuators/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(404).json({ error: 'Actuator not found' });
    }
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM actuators WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Actuator not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch actuator' });
  }
});

// Control actuator
controlRouter.post('/actuators/:id/control', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { id } = req.params;
    const { status, value } = req.body;

    // Update database
    const result = await pool.query(
      'UPDATE actuators SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Actuator not found' });
    }

    // Send MQTT command
    mqttService.publish(`actuators/${id}/control`, {
      status,
      value,
      timestamp: new Date().toISOString(),
    });

    // Send WebSocket update
    websocketService.sendActuatorUpdate(id, status);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to control actuator' });
  }
});

// Create actuator
controlRouter.post('/actuators', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { name, type, location, description } = req.body;
    const result = await pool.query(
      'INSERT INTO actuators (name, type, location, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, type, location, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create actuator' });
  }
});

// Update actuator
controlRouter.put('/actuators/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { id } = req.params;
    const { name, type, location, description } = req.body;
    const result = await pool.query(
      'UPDATE actuators SET name = $1, type = $2, location = $3, description = $4 WHERE id = $5 RETURNING *',
      [name, type, location, description || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Actuator not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update actuator' });
  }
});

// Delete actuator
controlRouter.delete('/actuators/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { id } = req.params;
    await pool.query('DELETE FROM actuators WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete actuator' });
  }
});

