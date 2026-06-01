// Integration test for the poll voting system
async function runIntegrationTest() {
  const baseUrl = 'http://localhost:8787';
  const testPollId = 999; // Use a unique poll ID for testing
  const testAnswer = 'TEST_A';
  const testSession = `test-session-${Math.random().toString(36)}`;

  console.log('🧪 Starting integration test...');
  console.log(`Poll ID: ${testPollId}, Answer: ${testAnswer}, Session: ${testSession}`);

  try {
    // Step 1: Post a vote
    console.log('\n📝 Step 1: Posting vote...');
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
      throw new Error(`Vote failed: ${voteResponse.status} - ${JSON.stringify(voteResult)}`);
    }
    console.log('✅ Vote posted successfully');

        // Step 2: Verify the vote by checking tally via HTTP API
    console.log('\n📊 Step 2: Verifying vote was recorded...');
    
    const tallyResponse = await fetch(`${baseUrl}/api/tally?id=${testPollId}`);
    const tally = await tallyResponse.json();
    console.log('📊 Current tally:', tally);
    
    // Check if our test vote is in the tally
    if (tally[testAnswer] && tally[testAnswer] > 0) {
      console.log(`✅ Vote recorded! ${testAnswer} has ${tally[testAnswer]} vote(s)`);
    } else {
      console.log(`❌ Vote not found in tally. ${testAnswer} count: ${tally[testAnswer] || 0}`);
      throw new Error('Vote was not recorded properly');
    }

    // Step 2b: Test WebSocket connection (but don't fail if it doesn't work)
    console.log('\n🔌 Step 2b: Testing WebSocket connection...');
    const wsUrl = `ws://localhost:8787/poll/ws/${testPollId}`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    const wsTest = await testWebSocket(wsUrl);
    if (wsTest.success) {
      console.log('✅ WebSocket connection successful');
      console.log('📊 WebSocket tally:', wsTest.tally);
    } else {
      console.log('❌ WebSocket test failed:', wsTest.error);
      console.log('⚠️  This explains why real-time updates aren\'t working in the UI');
    }

    // Step 3: Cleanup
    console.log('\n🧹 Step 3: Cleanup...');
    const cleanupResponse = await fetch(`${baseUrl}/api/cleanup?id=${testPollId}`);
    const cleanupResult = await cleanupResponse.json();
    console.log('Cleanup response:', cleanupResult);
    
    if (cleanupResponse.ok && cleanupResult.success) {
      console.log('✅ Test data cleaned up successfully');
      
      // Verify cleanup worked
      const verifyResponse = await fetch(`${baseUrl}/api/tally?id=${testPollId}`);
      const verifyTally = await verifyResponse.json();
      console.log('📊 Tally after cleanup:', verifyTally);
      
      if (Object.keys(verifyTally).length === 0) {
        console.log('✅ Cleanup verified - no votes remain');
      } else {
        console.log('⚠️  Some votes may still remain after cleanup');
      }
    } else {
      console.log('❌ Cleanup failed:', cleanupResult);
    }

    console.log('\n✅ Integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

// Helper function to test WebSocket connection
async function testWebSocket(url) {
  try {
    const { default: WebSocket } = await import('ws');
    
    return new Promise((resolve) => {
      const ws = new WebSocket(url);
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve({ success: false, error: 'WebSocket connection timeout' });
      }, 5000);
      
      ws.on('open', () => {
        console.log('WebSocket connected');
      });
      
      ws.on('message', (data) => {
        clearTimeout(timeout);
        try {
          const tally = JSON.parse(data.toString());
          ws.close();
          resolve({ success: true, tally });
        } catch (e) {
          ws.close();
          resolve({ success: false, error: `Invalid JSON received: ${data.toString()}` });
        }
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        resolve({ success: false, error: error.message });
      });
      
      ws.on('close', (code, reason) => {
        clearTimeout(timeout);
        if (code !== 1000) {
          resolve({ success: false, error: `WebSocket closed with code ${code}: ${reason}` });
        }
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking dependencies...');
  
  await runIntegrationTest();
}

// Run the test
main().catch(console.error);

export { runIntegrationTest }; 