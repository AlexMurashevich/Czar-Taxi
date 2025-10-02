import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { notificationService } from './services/notifications';

export function setupWebSocket(server: HTTPServer) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws',
  });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket client connected');
    
    notificationService.registerWebSocketClient(ws);

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      notificationService.unregisterWebSocketClient(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      notificationService.unregisterWebSocketClient(ws);
    });

    ws.send(JSON.stringify({ 
      type: 'connected',
      message: 'WebSocket connection established' 
    }));
  });

  console.log('WebSocket server initialized on /ws');
  
  return wss;
}
