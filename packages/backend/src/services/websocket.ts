import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface Client {
  ws: WebSocket;
  id: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const client: Client = { ws, id: clientId };
      this.clients.set(clientId, client);

      console.log(`WebSocket client connected: ${clientId}`);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connected',
        clientId,
        timestamp: new Date().toISOString(),
      });
    });

    console.log('WebSocket server initialized');
  }

  private handleMessage(clientId: string, data: any) {
    switch (data.type) {
      case 'subscribe':
        // Handle subscription to specific topics
        break;
      case 'unsubscribe':
        // Handle unsubscription
        break;
      default:
        console.log(`Unknown message type from ${clientId}:`, data.type);
    }
  }

  broadcast(data: any) {
    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  sendToClient(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  sendSensorUpdate(sensorId: string, data: any) {
    this.broadcast({
      type: 'sensor_update',
      sensorId,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  sendAlarm(alarm: any) {
    this.broadcast({
      type: 'alarm',
      alarm,
      timestamp: new Date().toISOString(),
    });
  }

  sendActuatorUpdate(actuatorId: string, status: string) {
    this.broadcast({
      type: 'actuator_update',
      actuatorId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  sendRobotUpdate(robotId: string, status: any) {
    this.broadcast({
      type: 'robot_update',
      robotId,
      status,
      timestamp: new Date().toISOString(),
    });
  }
}

export const websocketService = new WebSocketService();

