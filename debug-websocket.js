// Simple WebSocket debugging script
import { default as WebSocket } from 'ws';

async function debugWebSocket() {
  const url = 'ws://localhost:8787/poll/ws/1';
  console.log('🔌 Connecting to:', url);
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log('✅ WebSocket connection opened');
  });
  
  ws.on('message', (data) => {
    console.log('📨 Received message:', data.toString());
    ws.close();
  });
  
  ws.on('error', (error) => {
    console.log('❌ WebSocket error:', error.message);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket closed with code ${code}: ${reason}`);
    process.exit(0);
  });
  
  // Timeout after 10 seconds
  setTimeout(() => {
    console.log('⏰ Timeout - closing connection');
    ws.close();
  }, 10000);
}

debugWebSocket().catch(console.error); 