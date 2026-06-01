// Test PartyServer WebSocket specifically
import { default as WebSocket } from 'ws';

async function testPartyServerWebSocket() {
  console.log('🧪 Testing PartyServer WebSocket...');
  
  const wsUrl = 'ws://localhost:8787/parties/pollroom/1';
  console.log('🔌 Connecting to:', wsUrl);
  
  return new Promise((resolve) => {
    const ws = new WebSocket(wsUrl);
    let connected = false;
    
    const timeout = setTimeout(() => {
      if (!connected) {
        console.log('⏰ Connection timeout');
        ws.close();
        resolve({ success: false, error: 'Connection timeout' });
      }
    }, 5000);
    
    ws.on('open', () => {
      connected = true;
      console.log('✅ WebSocket connected to PartyServer!');
    });
    
    ws.on('message', (data) => {
      console.log('📨 Received message:', data.toString());
      clearTimeout(timeout);
      ws.close();
      resolve({ 
        success: true, 
        message: data.toString(),
        note: 'PartyServer WebSocket is working!' 
      });
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      clearTimeout(timeout);
      resolve({ success: false, error: error.message });
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket closed: ${code} ${reason || '(no reason)'}`);
      clearTimeout(timeout);
      if (!connected) {
        resolve({ success: false, error: `Connection failed: ${code}` });
      }
    });
  });
}

// Test the PartyServer WebSocket
testPartyServerWebSocket().then(result => {
  console.log('\n📋 Test Result:', result);
  if (result.success) {
    console.log('🎉 PartyServer WebSocket is working!');
  } else {
    console.log('❌ PartyServer WebSocket failed:', result.error);
  }
}).catch(console.error); 