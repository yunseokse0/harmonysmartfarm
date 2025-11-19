import mqtt, { MqttClient } from 'mqtt';
import dotenv from 'dotenv';
import { mqttService } from './mqtt';

dotenv.config();

// MQTT Simulator for testing without actual sensors
class MQTTSimulator {
  private client: MqttClient | null = null;
  private interval: NodeJS.Timeout | null = null;
  private sensors: Map<string, { type: string; value: number; unit: string; min: number; max: number; trend: 'up' | 'down' | 'stable' }> = new Map();

  async connect() {
    const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
    const username = process.env.MQTT_USERNAME;
    const password = process.env.MQTT_PASSWORD;

    const options: any = {
      clientId: `smartfarm-simulator-${Date.now()}`,
    };

    if (username && password) {
      options.username = username;
      options.password = password;
    }

    try {
      this.client = mqtt.connect(brokerUrl, options);

      this.client.on('connect', () => {
        console.log('MQTT Simulator connected');
        this.initializeSensors();
        this.startSimulation();
      });

      this.client.on('error', (error) => {
        console.warn('MQTT Simulator connection error (continuing without MQTT):', error.message);
        // Start simulation anyway (data will be generated but not sent via MQTT)
        this.initializeSensors();
        this.startSimulation();
      });
    } catch (error) {
      console.warn('MQTT Simulator not available (continuing without MQTT)');
      // Start simulation anyway
      this.initializeSensors();
      this.startSimulation();
    }
  }

  private initializeSensors() {
    // Initialize sensor configurations (스마트팜코리아 권장 센서 기준)
    this.sensors.set('1', {
      type: 'temperature',
      value: 25,
      unit: '℃',
      min: 20,
      max: 35,
      trend: 'stable',
    });

    this.sensors.set('2', {
      type: 'humidity',
      value: 60,
      unit: '%',
      min: 40,
      max: 80,
      trend: 'stable',
    });

    this.sensors.set('3', {
      type: 'co2',
      value: 400,
      unit: 'ppm',
      min: 350,
      max: 1200,
      trend: 'stable',
    });

    this.sensors.set('4', {
      type: 'par',
      value: 500,
      unit: 'μmol/m²/s',
      min: 0,
      max: 2000,
      trend: 'stable',
    });

    this.sensors.set('5', {
      type: 'solar_radiation',
      value: 800,
      unit: 'W/m²',
      min: 0,
      max: 1500,
      trend: 'stable',
    });

    this.sensors.set('6', {
      type: 'soil_moisture',
      value: 40,
      unit: '%',
      min: 15,
      max: 70,
      trend: 'stable',
    });

    this.sensors.set('7', {
      type: 'soil_ec',
      value: 1.5,
      unit: 'dS/m',
      min: 0.5,
      max: 3.0,
      trend: 'stable',
    });

    this.sensors.set('8', {
      type: 'soil_ph',
      value: 6.5,
      unit: 'pH',
      min: 5.0,
      max: 8.0,
      trend: 'stable',
    });

    this.sensors.set('9', {
      type: 'wind_speed',
      value: 2.5,
      unit: 'm/s',
      min: 0,
      max: 15,
      trend: 'stable',
    });

    this.sensors.set('10', {
      type: 'wind_direction',
      value: 180,
      unit: '°',
      min: 0,
      max: 360,
      trend: 'stable',
    });
  }

  private startSimulation() {
    // Simulate sensor data every 30 seconds
    this.interval = setInterval(async () => {
      for (const [sensorId, sensor] of this.sensors.entries()) {
        this.updateSensorValue(sensor);
        await this.publishSensorData(sensorId, sensor);
      }
    }, 30000); // 30 seconds

    // Publish initial data immediately
    (async () => {
      for (const [sensorId, sensor] of this.sensors.entries()) {
        await this.publishSensorData(sensorId, sensor);
      }
    })();
  }

  private updateSensorValue(sensor: any) {
    // Simulate realistic value changes
    let change = 0;

    switch (sensor.trend) {
      case 'up':
        change = Math.random() * 0.5;
        break;
      case 'down':
        change = -Math.random() * 0.5;
        break;
      case 'stable':
        change = (Math.random() - 0.5) * 0.3;
        break;
    }

    sensor.value += change;

    // Keep within bounds
    if (sensor.value < sensor.min) {
      sensor.value = sensor.min;
      sensor.trend = 'up';
    } else if (sensor.value > sensor.max) {
      sensor.value = sensor.max;
      sensor.trend = 'down';
    }

    // Occasionally change trend
    if (Math.random() < 0.1) {
      const trends: ('up' | 'down' | 'stable')[] = ['up', 'down', 'stable'];
      sensor.trend = trends[Math.floor(Math.random() * trends.length)];
    }
  }

  private async publishSensorData(sensorId: string, sensor: any) {
    const topic = `sensors/${sensorId}/data`;
    const message = {
      type: sensor.type,
      value: Math.round(sensor.value * 100) / 100, // Round to 2 decimal places
      unit: sensor.unit,
      timestamp: new Date().toISOString(),
    };

    if (this.client && this.client.connected) {
      this.client.publish(topic, JSON.stringify(message));
    } else {
      // If MQTT is not available, directly call the handler to process data
      await mqttService.handleSensorData(topic, message);
      console.log(`[Simulator] ${topic}: ${message.value} ${message.unit}`);
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.client) {
      this.client.end();
    }
  }
}

export const mqttSimulator = new MQTTSimulator();

