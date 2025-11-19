import { pool } from './database';
import { mqttService } from './mqtt';

interface SensorData {
  sensorId: string;
  sensorType: string;
  value: number;
  timestamp: Date;
}

interface Rule {
  id: number;
  name: string;
  condition: any;
  action: any;
  enabled: boolean;
  priority: number;
}

class RuleEngine {
  private rules: Rule[] = [];
  private evaluationInterval: NodeJS.Timeout | null = null;

  async loadRules() {
    const result = await pool.query(
      'SELECT * FROM rules WHERE enabled = true ORDER BY priority DESC'
    );
    this.rules = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      condition: row.condition_json,
      action: row.action_json,
      enabled: row.enabled,
      priority: row.priority,
    }));
  }

  evaluate(sensorData: SensorData) {
    for (const rule of this.rules) {
      if (this.checkCondition(rule.condition, sensorData)) {
        this.executeAction(rule.action);
      }
    }
  }

  private checkCondition(condition: any, sensorData: SensorData): boolean {
    if (condition.type === 'sensor') {
      if (condition.sensorId !== sensorData.sensorId && condition.sensorType !== sensorData.sensorType) {
        return false;
      }

      const value = sensorData.value;
      const operator = condition.operator;
      const threshold = condition.threshold;

      switch (operator) {
        case '>':
          return value > threshold;
        case '>=':
          return value >= threshold;
        case '<':
          return value < threshold;
        case '<=':
          return value <= threshold;
        case '==':
          return value === threshold;
        case '!=':
          return value !== threshold;
        default:
          return false;
      }
    }

    if (condition.type === 'and') {
      return condition.conditions.every((c: any) => this.checkCondition(c, sensorData));
    }

    if (condition.type === 'or') {
      return condition.conditions.some((c: any) => this.checkCondition(c, sensorData));
    }

    return false;
  }

  private async executeAction(action: any) {
    if (action.type === 'actuator') {
      // Update actuator status in database
      await pool.query(
        'UPDATE actuators SET status = $1 WHERE id = $2',
        [action.status, action.actuatorId]
      );

      // Send MQTT command
      mqttService.publish(`actuators/${action.actuatorId}/control`, {
        status: action.status,
        value: action.value,
      });
    }

    if (action.type === 'robot') {
      // Send robot command
      mqttService.publish(`robots/${action.robotId}/command`, {
        command: action.command,
        parameters: action.parameters,
      });
    }
  }

  start() {
    this.loadRules().catch(console.error);
    // Reload rules every 5 minutes
    this.evaluationInterval = setInterval(() => {
      this.loadRules().catch(console.error);
    }, 5 * 60 * 1000);
  }

  stop() {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
    }
  }
}

export const ruleEngine = new RuleEngine();

