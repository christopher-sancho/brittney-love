import fs from 'fs';

// Read the failed messages
const backupMessages = JSON.parse(fs.readFileSync('/Users/christophersancho/Downloads/birthday-messages.json', 'utf8'));

// Find the specific failed image messages
const failedMessages = backupMessages.filter(msg => 
  (msg.name === "Michelle Moonsie aka Aunty" || msg.name === "Kerry sancho") && msg.image
);

console.log(`Found ${failedMessages.length} failed image messages to restore`);

failedMessages.forEach((msg, i) => {
  console.log(`${i + 1}. ${msg.name}: ${msg.message} [Image size: ${msg.image.length} chars]`);
});

// Function to restore a message via API using built-in fetch
async function restoreMessage(message) {
  try {
    const response = await fetch('https://brittney-love.vercel.app/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: message.name,
        message: message.message,
        image: message.image
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Restored image message from ${message.name}`);
      return result;
    } else {
      const errorText = await response.text();
      console.log(`❌ Failed to restore ${message.name}: ${response.status} - ${errorText}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error restoring ${message.name}:`, error.message);
    return null;
  }
}

// Restore the failed messages
async function restoreFailed() {
  console.log('\n🔄 Restoring failed image messages...\n');
  
  for (let i = 0; i < failedMessages.length; i++) {
    const message = failedMessages[i];
    console.log(`Restoring ${i + 1}/${failedMessages.length}: ${message.name}`);
    
    await restoreMessage(message);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Failed message restoration complete!');
}

// Run the restoration
restoreFailed();
