import { Router } from 'express';
import { pool } from '../services/database';
import { mqttService } from '../services/mqtt';
import { websocketService } from '../services/websocket';

export const controlRouter = Router();

// Get all actuators
controlRouter.get('/actuators', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM actuators ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch actuators' });
  }
});

// Get actuator by ID
controlRouter.get('/actuators/:id', async (req, res) => {
  try {
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
    const { name, type, location } = req.body;
    const result = await pool.query(
      'INSERT INTO actuators (name, type, location) VALUES ($1, $2, $3) RETURNING *',
      [name, type, location]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create actuator' });
  }
});

