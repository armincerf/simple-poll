// Test the exact user experience flow
import { default as WebSocket } from 'ws';

async function testUserExperience() {
  const baseUrl = 'http://localhost:8787';
  const testPollId = 777;
  
  console.log('🧪 Testing complete user experience...');
  console.log(`Poll ID: ${testPollId}`);

  try {
    // Step 1: Simulate a user landing on the question page
    console.log('\n👤 Step 1: User visits question page...');
    const questionPageResponse = await fetch(`${baseUrl}/poll/question/${testPollId}`);
    console.log('Question page status:', questionPageResponse.status);
    
    // Step 2: Simulate the WebSocket connection from the question page
    console.log('\n🔌 Step 2: Establishing WebSocket connection (like browser would)...');
    const wsUrl = `ws://localhost:8787/poll/ws/${testPollId}`;
    
    const receivedMessages = [];
    
    const questionPageWatcher = new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let messageCount = 0;
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve({ 
          success: messageCount >= 2, 
          messages: receivedMessages,
          messageCount 
        });
      }, 10000);
      
      ws.on('open', () => {
        console.log('✅ Question page WebSocket connected');
      });
      
      ws.on('message', (data) => {
        messageCount++;
        const tally = JSON.parse(data.toString());
        receivedMessages.push(tally);
        console.log(`📨 Question page received message ${messageCount}:`, tally);
        
        // After receiving initial message, simulate someone voting
        if (messageCount === 1) {
          console.log('\n👤 Step 3: Another user votes...');
          setTimeout(() => simulateVote(), 1000);
        }
        
        // If we get a second message, we're done
        if (messageCount >= 2) {
          clearTimeout(timeout);
          ws.close();
          resolve({ 
            success: true, 
            messages: receivedMessages,
            messageCount 
          });
        }
      });
      
      ws.on('error', (error) => {
        console.error('❌ Question page WebSocket error:', error);
        clearTimeout(timeout);
        reject(error);
      });
      
      ws.on('close', (code, reason) => {
        console.log(`🔌 Question page WebSocket closed: ${code} ${reason}`);
        clearTimeout(timeout);
      });
    });
    
    // Function to simulate voting (like from answer page)
    async function simulateVote() {
      const voteData = {
        id: testPollId,
        answer: 'TEST_VOTE',
        session: `test-${Date.now()}`
      };
      
      console.log('🗳️  Posting vote:', voteData);
      
      const voteResponse = await fetch(`${baseUrl}/api/vote`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(voteData),
      });

      const voteResult = await voteResponse.json();
      console.log('📊 Vote result:', voteResult);
      
      if (voteResponse.ok && voteResult.success) {
        console.log('✅ Vote successful, waiting for live update on question page...');
      } else {
        console.error('❌ Vote failed');
      }
    }
    
    // Wait for the complete flow
    const result = await questionPageWatcher;
    
    console.log('\n📋 Test Results:');
    console.log('- Messages received:', result.messageCount);
    console.log('- Success:', result.success);
    console.log('- All messages:', result.messages);
    
    if (result.success) {
      console.log('\n✅ Live updates work correctly!');
      console.log('📊 Initial tally:', result.messages[0]);
      console.log('📊 Updated tally:', result.messages[1]);
      
      // Check if the new vote appears
      const hasNewVote = result.messages[1]?.TEST_VOTE > 0;
      console.log('🎯 New vote visible in update:', hasNewVote);
    } else {
      console.log('\n❌ Live updates are not working');
      console.log('🔍 This explains why users don\'t see results update in real-time');
      
      if (result.messageCount === 1) {
        console.log('💡 Issue: Only initial tally received, no live updates');
      } else if (result.messageCount === 0) {
        console.log('💡 Issue: No WebSocket messages received at all');
      }
    }
    
    // Step 4: Cleanup
    console.log('\n🧹 Cleaning up...');
    const cleanupResponse = await fetch(`${baseUrl}/api/cleanup?id=${testPollId}`);
    const cleanupResult = await cleanupResponse.json();
    console.log('Cleanup result:', cleanupResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUserExperience().catch(console.error); 