import { Router } from 'express';
import { pool } from '../services/database';
import { querySensorData } from '../services/influxdb';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export const reportRouter = Router();

// Generate daily report
reportRouter.get('/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    // Get all sensors
    const sensorsResult = await pool.query('SELECT * FROM sensors');
    const sensors = sensorsResult.rows;

    // Get sensor data for the day
    const sensorData: any = {};
    for (const sensor of sensors) {
      try {
        const data = await querySensorData(sensor.id.toString(), start, end);
        sensorData[sensor.id] = data;
      } catch (error) {
        console.error(`Error getting data for sensor ${sensor.id}:`, error);
        sensorData[sensor.id] = [];
      }
    }

    // Get alarms for the day
    const alarmsResult = await pool.query(
      `SELECT * FROM alarms 
       WHERE created_at >= $1 AND created_at <= $2 
       ORDER BY created_at DESC`,
      [start, end]
    );

    // Get actuator activities (would need activity log table in production)
    const actuatorsResult = await pool.query('SELECT * FROM actuators');

    // Calculate statistics
    const stats: any = {};
    sensors.forEach((sensor) => {
      const data = sensorData[sensor.id] || [];
      if (data.length > 0) {
        const values = data.map((d: any) => d.value || d._value).filter((v: any) => v != null);
        if (values.length > 0) {
          stats[sensor.id] = {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
            count: values.length,
          };
        }
      }
    });

    res.json({
      date: format(targetDate, 'yyyy-MM-dd'),
      sensors: sensors.map((sensor) => ({
        ...sensor,
        data: sensorData[sensor.id] || [],
        stats: stats[sensor.id] || null,
      })),
      alarms: alarmsResult.rows,
      actuators: actuatorsResult.rows,
      summary: {
        totalSensors: sensors.length,
        totalAlarms: alarmsResult.rows.length,
        criticalAlarms: alarmsResult.rows.filter((a) => a.severity === 'critical').length,
      },
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

// Generate weekly report
reportRouter.get('/weekly', async (req, res) => {
  try {
    const { week } = req.query;
    const endDate = week ? new Date(week as string) : new Date();
    const startDate = subDays(endDate, 7);

    // Get sensors
    const sensorsResult = await pool.query('SELECT * FROM sensors');
    const sensors = sensorsResult.rows;

    // Get aggregated data for the week
    const weeklyData: any = {};
    for (const sensor of sensors) {
      try {
        const data = await querySensorData(sensor.id.toString(), startDate, endDate);
        weeklyData[sensor.id] = data;
      } catch (error) {
        weeklyData[sensor.id] = [];
      }
    }

    // Get alarms for the week
    const alarmsResult = await pool.query(
      `SELECT * FROM alarms 
       WHERE created_at >= $1 AND created_at <= $2 
       ORDER BY created_at DESC`,
      [startDate, endDate]
    );

    // Calculate weekly statistics
    const stats: any = {};
    sensors.forEach((sensor) => {
      const data = weeklyData[sensor.id] || [];
      if (data.length > 0) {
        const values = data.map((d: any) => d.value || d._value).filter((v: any) => v != null);
        if (values.length > 0) {
          stats[sensor.id] = {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
            count: values.length,
          };
        }
      }
    });

    res.json({
      period: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
      },
      sensors: sensors.map((sensor) => ({
        ...sensor,
        data: weeklyData[sensor.id] || [],
        stats: stats[sensor.id] || null,
      })),
      alarms: alarmsResult.rows,
      summary: {
        totalSensors: sensors.length,
        totalAlarms: alarmsResult.rows.length,
        criticalAlarms: alarmsResult.rows.filter((a) => a.severity === 'critical').length,
        warningAlarms: alarmsResult.rows.filter((a) => a.severity === 'warning').length,
      },
    });
  } catch (error) {
    console.error('Error generating weekly report:', error);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});

// Generate monthly report
reportRouter.get('/monthly', async (req, res) => {
  try {
    const { month } = req.query;
    const targetDate = month ? new Date(month as string) : new Date();
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    // Get sensors
    const sensorsResult = await pool.query('SELECT * FROM sensors');
    const sensors = sensorsResult.rows;

    // Get aggregated data for the month
    const monthlyData: any = {};
    for (const sensor of sensors) {
      try {
        const data = await querySensorData(sensor.id.toString(), startDate, endDate);
        monthlyData[sensor.id] = data;
      } catch (error) {
        monthlyData[sensor.id] = [];
      }
    }

    // Get alarms for the month
    const alarmsResult = await pool.query(
      `SELECT * FROM alarms 
       WHERE created_at >= $1 AND created_at <= $2 
       ORDER BY created_at DESC`,
      [startDate, endDate]
    );

    // Calculate monthly statistics
    const stats: any = {};
    sensors.forEach((sensor) => {
      const data = monthlyData[sensor.id] || [];
      if (data.length > 0) {
        const values = data.map((d: any) => d.value || d._value).filter((v: any) => v != null);
        if (values.length > 0) {
          stats[sensor.id] = {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a: number, b: number) => a + b, 0) / values.length,
            count: values.length,
          };
        }
      }
    });

    res.json({
      month: format(targetDate, 'yyyy-MM'),
      sensors: sensors.map((sensor) => ({
        ...sensor,
        data: monthlyData[sensor.id] || [],
        stats: stats[sensor.id] || null,
      })),
      alarms: alarmsResult.rows,
      summary: {
        totalSensors: sensors.length,
        totalAlarms: alarmsResult.rows.length,
        criticalAlarms: alarmsResult.rows.filter((a) => a.severity === 'critical').length,
        warningAlarms: alarmsResult.rows.filter((a) => a.severity === 'warning').length,
        infoAlarms: alarmsResult.rows.filter((a) => a.severity === 'info').length,
      },
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

