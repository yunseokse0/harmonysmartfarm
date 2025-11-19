import mqtt, { MqttClient } from 'mqtt';
import dotenv from 'dotenv';
import { writeSensorData } from './influxdb';
import { ruleEngine } from './ruleEngine';
import { alarmService } from './alarmService';
import { websocketService } from './websocket';

dotenv.config();

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const username = process.env.MQTT_USERNAME;
const password = process.env.MQTT_PASSWORD;

class MQTTService {
  private client: MqttClient | null = null;

  async connect() {
    const options: any = {
      clientId: `smartfarm-server-${Date.now()}`,
    };

    if (username && password) {
      options.username = username;
      options.password = password;
    }

    this.client = mqtt.connect(brokerUrl, options);

    this.client.on('connect', () => {
      console.log('MQTT client connected');
      // Subscribe to sensor topics
      this.client?.subscribe('sensors/+/data', (err) => {
        if (err) {
          console.error('Error subscribing to sensor topics:', err);
        } else {
          console.log('Subscribed to sensor topics');
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        await this.handleSensorData(topic, data);
      } catch (error) {
        console.error('Error processing MQTT message:', error);
      }
    });

    this.client.on('error', (error) => {
      console.error('MQTT error:', error);
    });
  }

  async handleSensorData(topic: string, data: any) {
    const parts = topic.split('/');
    const sensorId = parts[1];
    const sensorType = data.type || 'unknown';
    const value = data.value;
    const unit = data.unit;

    // Write to InfluxDB
    await writeSensorData(sensorId, sensorType, value, unit);

    // Send WebSocket update
    websocketService.sendSensorUpdate(sensorId, {
      sensorId,
      sensorType,
      value,
      unit,
      timestamp: new Date().toISOString(),
    });

    // Evaluate rules
    ruleEngine.evaluate({
      sensorId,
      sensorType,
      value,
      timestamp: new Date(),
    });

    // Check alarms
    alarmService.checkThresholds({
      sensorId,
      sensorType,
      value,
      unit,
    });
  }

  publish(topic: string, message: any) {
    if (this.client?.connected) {
      this.client.publish(topic, JSON.stringify(message));
    }
  }

  disconnect() {
    this.client?.end();
  }
}

export const mqttService = new MQTTService();

