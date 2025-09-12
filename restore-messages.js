import fs from 'fs';

// Read the backup messages
const backupMessages = JSON.parse(fs.readFileSync('/Users/christophersancho/Downloads/birthday-messages.json', 'utf8'));

console.log(`Found ${backupMessages.length} messages in backup`);

// Filter out test messages - keep only real birthday messages
const realMessages = backupMessages.filter(msg => {
  // Skip obvious test messages
  if (msg.name === 'chris' && msg.message.includes('i love her')) {
    console.log('Skipping test message:', msg.name, msg.message.substring(0, 20));
    return false;
  }
  if (msg.name === 'i love her ') {
    console.log('Skipping test message:', msg.name, msg.message.substring(0, 20));
    return false;
  }
  
  // Keep real messages
  console.log('Keeping real message:', msg.name, msg.message.substring(0, 30));
  return true;
});

console.log(`\nFiltered to ${realMessages.length} real messages`);

// Function to restore a message via API
async function restoreMessage(message) {
  const fetch = (await import('node-fetch')).default;
  try {
    const response = await fetch('https://brittney-love.vercel.app/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: message.name,
        message: message.message,
        image: message.image // Include image if present
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Restored message from ${message.name}`);
      return result;
    } else {
      console.log(`❌ Failed to restore message from ${message.name}:`, response.status);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error restoring message from ${message.name}:`, error.message);
    return null;
  }
}

// Restore all real messages
async function restoreAll() {
  console.log('\n🔄 Starting restoration...\n');
  
  for (let i = 0; i < realMessages.length; i++) {
    const message = realMessages[i];
    console.log(`Restoring ${i + 1}/${realMessages.length}: ${message.name}`);
    
    await restoreMessage(message);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n🎉 Restoration complete!');
}

// Show the messages that will be restored
console.log('\n📝 Messages to restore:');
realMessages.forEach((msg, i) => {
  console.log(`${i + 1}. ${msg.name}: "${msg.message.substring(0, 50)}..." ${msg.image ? '[HAS IMAGE]' : ''}`);
});

console.log('\n🚀 Run restoreAll() to restore these messages');

// Auto-run the restoration
restoreAll();
