import fs from 'fs';

// Read current messages
const messages = JSON.parse(fs.readFileSync('./final-messages-4.json', 'utf8'));

// Add Giorgio & Kelcey's message
const giorgioMessage = {
  name: "Giorgio & Kelcey",
  message: "Happy 29th birthday Britt 🥳 wishing you an amazing new year ahead filled with love and happiness ❤️",
  id: `restored_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
  timestamp: "2025-09-12T18:51:20.539Z",
  messageIndex: messages.length + 1
};

// Add Haley's message
const haleyMessage = {
  name: "Haley",
  message: "Shared a favorite picture! 📸💕",
  id: `restored_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
  timestamp: "2025-09-12T18:52:30.539Z",
  messageIndex: messages.length + 2,
  imageUrl: "https://5fk1qrmoyae10nba.public.blob.vercel-storage.com/image-1757711371342ui5knmlc4.jpg",
  hasImage: true
};

// Add to messages array
messages.push(giorgioMessage);
messages.push(haleyMessage);

// Sort by timestamp
messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

// Save back to file
fs.writeFileSync('./final-messages-5.json', JSON.stringify(messages, null, 2));

console.log('Added messages from:', [giorgioMessage.name, haleyMessage.name].join(', '));
console.log('New total messages:', messages.length);
