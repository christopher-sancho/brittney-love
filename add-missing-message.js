import fs from 'fs';

// Read current messages
const messages = JSON.parse(fs.readFileSync('./final-messages-4.json', 'utf8'));

// Add Giorgio & Kelcey's message
const newMessage = {
  name: "Giorgio & Kelcey",
  message: "Happy 29th birthday Britt 🥳 wishing you an amazing new year ahead filled with love and happiness ❤️",
  id: `restored_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
  timestamp: "2025-09-12T18:51:20.539Z",
  messageIndex: messages.length + 1
};

// Add to messages array
messages.push(newMessage);

// Sort by timestamp
messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

// Save back to file
fs.writeFileSync('./final-messages-5.json', JSON.stringify(messages, null, 2));

console.log('Added message from:', newMessage.name);
console.log('New total messages:', messages.length);
