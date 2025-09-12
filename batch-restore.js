import fs from 'fs';

// Read the backup messages
const backupMessages = JSON.parse(fs.readFileSync('/Users/christophersancho/Downloads/birthday-messages.json', 'utf8'));

// Filter out test messages - keep only real birthday messages
const realMessages = backupMessages.filter(msg => {
  // Skip obvious test messages
  if (msg.name === 'chris' && msg.message.includes('i love her')) {
    return false;
  }
  if (msg.name === 'i love her ') {
    return false;
  }
  if (msg.name === '') {
    return false;
  }
  
  return true;
});

console.log(`Found ${realMessages.length} real messages to restore`);

// Create a new batch restore API call
const batchData = realMessages.map((msg, index) => ({
  name: msg.name,
  message: msg.message,
  image: msg.image,
  originalId: msg.id,
  originalTimestamp: msg.timestamp,
  messageIndex: index + 1
}));

// Save to a JSON file that we can upload via the API
fs.writeFileSync('batch-messages.json', JSON.stringify(batchData, null, 2));

console.log('Created batch-messages.json with all messages');
console.log('Now we need to create an API endpoint to restore the batch...');
