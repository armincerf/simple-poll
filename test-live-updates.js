// Test live updates - simulate real user scenario
import { default as WebSocket } from 'ws';

async function testLiveUpdates() {
  const baseUrl = 'http://localhost:8787';
  const testPollId = 888; // Use a different poll ID for this test
  
  console.log('🧪 Testing live updates...');
  console.log(`Poll ID: ${testPollId}`);

  try {
    // Step 1: Start watching the poll (like a user on the question page)
    console.log('\n👀 Step 1: Starting to watch poll (simulating question page)...');
    const wsUrl = `ws://localhost:8787/parties/pollroom/${testPollId}`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    const watcherPromise = new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      let messageCount = 0;
      let initialTally = null;
      let updatedTally = null;
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Timeout waiting for live updates'));
      }, 15000);
      
      ws.on('open', () => {
        console.log('✅ Watcher WebSocket connected');
      });
      
      ws.on('message', (data) => {
        messageCount++;
        const tally = JSON.parse(data.toString());
        console.log(`📨 Message ${messageCount} received:`, tally);
        
        if (messageCount === 1) {
          initialTally = tally;
          console.log('📊 Initial tally received, now voting...');
          
          // Trigger vote after we receive initial tally
          setTimeout(() => voteInBackground(), 1000);
        } else if (messageCount === 2) {
          updatedTally = tally;
          console.log('🎉 Live update received!');
          clearTimeout(timeout);
          ws.close();
          resolve({ initialTally, updatedTally, success: true });
        }
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      
      ws.on('close', (code, reason) => {
        clearTimeout(timeout);
        if (messageCount < 2) {
          reject(new Error(`WebSocket closed before receiving live update. Messages received: ${messageCount}`));
        }
      });
    });
    
    // Function to vote while the watcher is connected
    async function voteInBackground() {
      console.log('\n🗳️  Step 2: Casting vote (simulating another user voting)...');
      
      const testAnswer = 'LIVE_TEST';
      const testSession = `live-test-${Math.random().toString(36)}`;
      
      try {
        const voteResponse = await fetch(`${baseUrl}/api/vote`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ 
            id: testPollId, 
            answer: testAnswer, 
            session: testSession
          }),
        });

        const voteResult = await voteResponse.json();
        console.log('Vote response:', voteResult);
        
        if (!voteResponse.ok || !voteResult.success) {
          throw new Error(`Vote failed: ${voteResponse.status}`);
        }
        console.log('✅ Vote cast successfully, waiting for live update...');
      } catch (error) {
        console.error('❌ Error voting:', error);
      }
    }
    
    // Wait for the live update test to complete
    const result = await watcherPromise;
    
    if (result.success) {
      console.log('\n✅ Live updates are working!');
      console.log('📊 Initial tally:', result.initialTally);
      console.log('📊 Updated tally:', result.updatedTally);
      
      // Verify the update contains our new vote
      const hasNewVote = result.updatedTally.LIVE_TEST > 0;
      if (hasNewVote) {
        console.log('🎯 Confirmed: New vote appears in live update');
      } else {
        console.log('⚠️  Warning: New vote not found in live update');
      }
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    const cleanupResponse = await fetch(`${baseUrl}/api/cleanup?id=${testPollId}`);
    const cleanupResult = await cleanupResponse.json();
    console.log('Cleanup response:', cleanupResult);
    
    console.log('\n✅ Live update test completed successfully!');
    
  } catch (error) {
    console.error('❌ Live update test failed:', error);
    
    // Still try to cleanup
    try {
      console.log('\n🧹 Attempting cleanup after failure...');
      await fetch(`${baseUrl}/api/cleanup?id=${testPollId}`);
    } catch (cleanupError) {
      console.log('⚠️  Cleanup also failed:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Run the test
testLiveUpdates().catch(console.error); 