import { pool } from './database';
import { websocketService } from './websocket';

interface SensorData {
  sensorId: string;
  sensorType: string;
  value: number;
  unit?: string;
}

interface AlarmThreshold {
  sensorId?: string; // Optional for default thresholds
  sensorType: string;
  min?: number;
  max?: number;
  severity: 'info' | 'warning' | 'critical';
}

class AlarmService {
  private thresholds: Map<string, AlarmThreshold[]> = new Map();

  async loadThresholds() {
    // Load thresholds from database or configuration
    // For now, using default thresholds
    const defaultThresholds: AlarmThreshold[] = [
      {
        sensorType: 'temperature',
        min: 10,
        max: 35,
        severity: 'warning',
      },
      {
        sensorType: 'temperature',
        min: 5,
        max: 40,
        severity: 'critical',
      },
      {
        sensorType: 'humidity',
        min: 40,
        max: 80,
        severity: 'warning',
      },
      {
        sensorType: 'soil_moisture',
        min: 20,
        max: 60,
        severity: 'warning',
      },
      {
        sensorType: 'soil_moisture',
        min: 15,
        max: 70,
        severity: 'critical',
      },
    ];

    this.thresholds.set('default', defaultThresholds);
  }

  checkThresholds(sensorData: SensorData) {
    const thresholds = this.thresholds.get('default') || [];
    const relevantThresholds = thresholds.filter(
      (t) => t.sensorType === sensorData.sensorType
    );

    for (const threshold of relevantThresholds) {
      const value = sensorData.value;
      let shouldAlarm = false;
      let message = '';

      if (threshold.min !== undefined && value < threshold.min) {
        shouldAlarm = true;
        message = `${sensorData.sensorType} is below minimum (${value} ${sensorData.unit || ''} < ${threshold.min} ${sensorData.unit || ''})`;
      }

      if (threshold.max !== undefined && value > threshold.max) {
        shouldAlarm = true;
        message = `${sensorData.sensorType} is above maximum (${value} ${sensorData.unit || ''} > ${threshold.max} ${sensorData.unit || ''})`;
      }

      if (shouldAlarm) {
        this.createAlarm({
          type: sensorData.sensorType,
          severity: threshold.severity,
          message,
          sensorId: sensorData.sensorId,
        });
      }
    }
  }

  private async createAlarm(alarm: {
    type: string;
    severity: string;
    message: string;
    sensorId: string;
  }) {
    try {
      // Check if similar alarm already exists (not resolved)
      const existing = await pool.query(
        `SELECT id FROM alarms 
         WHERE type = $1 AND sensor_id = $2 AND status = 'unread' 
         AND created_at > NOW() - INTERVAL '1 hour'`,
        [alarm.type, alarm.sensorId]
      );

      if (existing.rows.length === 0) {
        const result = await pool.query(
          `INSERT INTO alarms (type, severity, message, sensor_id, status)
           VALUES ($1, $2, $3, $4, 'unread') RETURNING *`,
          [alarm.type, alarm.severity, alarm.message, alarm.sensorId]
        );
        console.log(`Alarm created: ${alarm.message}`);
        
        // Send WebSocket notification
        if (result.rows.length > 0) {
          websocketService.sendAlarm(result.rows[0]);
        }
      }
    } catch (error) {
      console.error('Error creating alarm:', error);
    }
  }

  start() {
    this.loadThresholds();
  }
}

export const alarmService = new AlarmService();

