import { Router } from 'express';
import { getPool, isDbAvailable } from '../services/database';
import { ruleEngine } from '../services/ruleEngine';

export const ruleRouter = Router();

// Get all rules
ruleRouter.get('/', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.json([]);
    }
    const result = await pool.query('SELECT * FROM rules ORDER BY priority DESC, created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// Get rule by ID
ruleRouter.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM rules WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rule' });
  }
});

// Create rule
ruleRouter.post('/', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { name, description, condition, action, priority = 0 } = req.body;
    const result = await pool.query(
      'INSERT INTO rules (name, description, condition_json, action_json, priority) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description || null, JSON.stringify(condition), JSON.stringify(action), priority]
    );
    
    // Reload rules in engine
    ruleEngine.loadRules().catch(console.error);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// Update rule
ruleRouter.put('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { id } = req.params;
    const { name, description, condition, action, enabled, priority } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (condition !== undefined) {
      updates.push(`condition_json = $${paramIndex++}`);
      values.push(JSON.stringify(condition));
    }
    if (action !== undefined) {
      updates.push(`action_json = $${paramIndex++}`);
      values.push(JSON.stringify(action));
    }
    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(enabled);
    }
    if (priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE rules SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Reload rules in engine
    ruleEngine.loadRules().catch(console.error);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// Delete rule
ruleRouter.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { id } = req.params;
    await pool.query('DELETE FROM rules WHERE id = $1', [id]);
    
    // Reload rules in engine
    ruleEngine.loadRules().catch(console.error);
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// Toggle rule enabled status
ruleRouter.post('/:id/toggle', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE rules SET enabled = NOT enabled, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Reload rules in engine
    ruleEngine.loadRules().catch(console.error);

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle rule' });
  }
});

// Test/Simulate rule
ruleRouter.post('/:id/test', async (req, res) => {
  try {
    const pool = getPool();
    if (!pool || !isDbAvailable()) {
      return res.status(503).json({ error: 'Database not available' });
    }
    const { id } = req.params;
    const { sensorData } = req.body; // Simulated sensor data

    // Get rule
    const result = await pool.query('SELECT * FROM rules WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const rule = result.rows[0];
    const condition = typeof rule.condition_json === 'string' 
      ? JSON.parse(rule.condition_json) 
      : rule.condition_json;
    const action = typeof rule.action_json === 'string'
      ? JSON.parse(rule.action_json)
      : rule.action_json;

    // Simulate condition check
    const conditionMet = ruleEngine.simulateCondition(condition, sensorData);
    
    // Simulate action execution
    const simulatedEvents: any[] = [];
    if (conditionMet) {
      const actionResult = ruleEngine.simulateAction(action);
      simulatedEvents.push({
        timestamp: new Date().toISOString(),
        ruleId: rule.id,
        ruleName: rule.name,
        conditionMet: true,
        action: actionResult,
      });
    } else {
      simulatedEvents.push({
        timestamp: new Date().toISOString(),
        ruleId: rule.id,
        ruleName: rule.name,
        conditionMet: false,
        message: 'Condition not met',
      });
    }

    res.json({
      rule: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
      },
      sensorData,
      result: {
        conditionMet,
        events: simulatedEvents,
      },
    });
  } catch (error) {
    console.error('Error testing rule:', error);
    res.status(500).json({ error: 'Failed to test rule' });
  }
});

