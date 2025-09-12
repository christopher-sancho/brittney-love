import fs from 'fs';

// Read the final messages
const finalMessages = JSON.parse(fs.readFileSync('final-messages.json', 'utf8'));

console.log(`Uploading ${finalMessages.length} messages via direct restore...`);

async function directRestore() {
  try {
    const response = await fetch('https://brittney-love.vercel.app/api/direct-restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: finalMessages
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS!');
      console.log(`📊 Restored ${result.restoredCount} messages`);
      console.log(`🔗 Blob URL: ${result.blobUrl}`);
    } else {
      const error = await response.text();
      console.log('❌ FAILED:', response.status, error);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

directRestore();
