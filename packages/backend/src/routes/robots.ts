import { Router } from 'express';
import { getPool, isDbAvailable } from '../services/database';
import { mqttService } from '../services/mqtt';
import { websocketService } from '../services/websocket';

export const robotRouter = Router();

// Get all robots
robotRouter.get('/', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.json([]);
    }
    const result = await pool.query('SELECT * FROM robots ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch robots' });
  }
});

// Get robot by ID
robotRouter.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(404).json({ error: 'Robot not found' });
    }
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM robots WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Robot not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch robot' });
  }
});

// Control robot
robotRouter.post('/:id/command', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { id } = req.params;
    const { command, parameters } = req.body;

    // Update robot status
    await pool.query(
      'UPDATE robots SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [command === 'start' ? 'working' : 'idle', id]
    );

    // Send MQTT command
    mqttService.publish(`robots/${id}/command`, {
      command,
      parameters,
      timestamp: new Date().toISOString(),
    });

    // Send WebSocket update
    websocketService.sendRobotUpdate(id, {
      status: command === 'start' ? 'working' : 'idle',
      command,
    });

    res.json({ success: true, message: `Robot ${id} command ${command} sent` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send robot command' });
  }
});

// Get robot status
robotRouter.get('/:id/status', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(404).json({ error: 'Robot not found' });
    }
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM robots WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Robot not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch robot status' });
  }
});

// Create robot
robotRouter.post('/', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { name, type, location, description } = req.body;
    const result = await pool.query(
      'INSERT INTO robots (name, type, location, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, type, JSON.stringify(location), description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create robot' });
  }
});

// Update robot
robotRouter.put('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { id } = req.params;
    const { name, type, location, description } = req.body;
    const result = await pool.query(
      'UPDATE robots SET name = $1, type = $2, location = $3, description = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, type, JSON.stringify(location), description || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Robot not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update robot' });
  }
});

// Delete robot
robotRouter.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { id } = req.params;
    await pool.query('DELETE FROM robots WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete robot' });
  }
});

