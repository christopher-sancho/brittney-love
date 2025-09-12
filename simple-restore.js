import fs from 'fs';

// Read just the first 5 messages to test
const allMessages = JSON.parse(fs.readFileSync('batch-messages.json', 'utf8'));
const testMessages = allMessages.slice(0, 5);

console.log(`Restoring ${testMessages.length} test messages...`);

// Restore one by one with delays
async function restoreMessages() {
  for (let i = 0; i < testMessages.length; i++) {
    const msg = testMessages[i];
    console.log(`${i + 1}. Restoring: ${msg.name} - ${msg.message.substring(0, 50)}...`);
    
    try {
      const response = await fetch('https://brittney-love.vercel.app/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: msg.name,
          message: msg.message,
          image: msg.image
        })
      });

      if (response.ok) {
        console.log('   ✅ Success');
      } else {
        console.log('   ❌ Failed:', response.status);
      }
    } catch (error) {
      console.log('   ❌ Error:', error.message);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎉 Test batch complete!');
}

restoreMessages();
