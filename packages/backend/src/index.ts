import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { sensorRouter } from './routes/sensors';
import { controlRouter } from './routes/control';
import { robotRouter } from './routes/robots';
import { ruleRouter } from './routes/rules';
import { alarmRouter } from './routes/alarms';
import { dashboardRouter } from './routes/dashboard';
import { aiRouter } from './routes/ai';
import { reportRouter } from './routes/reports';
import { datasetsRouter } from './routes/datasets';
import { openapiRouter } from './routes/openapi';
import { authRouter } from './routes/auth';
import { imagesRouter } from './routes/images';
import { mqttService } from './services/mqtt';
import { mqttSimulator } from './services/mqttSimulator';
import { ruleEngine } from './services/ruleEngine';
import { alarmService } from './services/alarmService';
import { websocketService } from './services/websocket';
import { initializeDatabase } from './services/database';
import { initializeInfluxDB } from './services/influxdb';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/sensors', sensorRouter);
app.use('/api/control', controlRouter);
app.use('/api/robots', robotRouter);
app.use('/api/rules', ruleRouter);
app.use('/api/alarms', alarmRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/ai', aiRouter);
app.use('/api/reports', reportRouter);
app.use('/api/datasets', datasetsRouter);
app.use('/api/openapi', openapiRouter);
app.use('/api/images', imagesRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize services
async function initialize() {
  try {
    // Initialize database (optional - will continue even if fails)
    const dbInitialized = await initializeDatabase();
    if (dbInitialized) {
      console.log('Database initialized');
    } else {
      console.warn('Running without database. Some features may be limited.');
    }

    // Initialize InfluxDB (optional)
    initializeInfluxDB();

    // Initialize MQTT service (optional - will fail gracefully if MQTT not available)
    try {
      await mqttService.connect();
      console.log('MQTT service connected');
    } catch (error) {
      console.warn('MQTT service not available, starting simulator...');
      // Start MQTT simulator for testing
      await mqttSimulator.connect();
    }

    // Initialize Rule Engine
    ruleEngine.start();
    console.log('Rule Engine started');

    // Initialize Alarm Service
    alarmService.start();
    console.log('Alarm Service started');

    // Initialize WebSocket
    websocketService.initialize(server);
    console.log('WebSocket service initialized');

    // Start server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`WebSocket: ws://localhost:${PORT}/ws`);
    });
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

initialize();
