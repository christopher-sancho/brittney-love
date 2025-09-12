import fs from 'fs';

// Read all messages and prepare them for direct upload
const allMessages = JSON.parse(fs.readFileSync('batch-messages.json', 'utf8'));

console.log(`Processing ${allMessages.length} messages for direct upload...`);

// Transform messages to the format expected by the backend
const processedMessages = allMessages.map((msg, index) => ({
  name: msg.name,
  message: msg.message,
  id: `restored_${Date.now()}_${index}`,
  timestamp: msg.originalTimestamp || new Date().toISOString(),
  messageIndex: index + 1,
  // Handle images if present
  ...(msg.image && {
    image: msg.image,
    hasImage: true
  })
}));

// Write the final JSON that should be uploaded to replace the current storage
fs.writeFileSync('final-messages.json', JSON.stringify(processedMessages, null, 2));

console.log(`✅ Created final-messages.json with ${processedMessages.length} messages`);
console.log('📝 This file needs to be manually uploaded to replace the current storage');

// Show a summary
console.log('\n📊 Message summary:');
processedMessages.forEach((msg, i) => {
  console.log(`${i + 1}. ${msg.name}: ${msg.message.substring(0, 40)}... ${msg.hasImage ? '[📸]' : ''}`);
});
