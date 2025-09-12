import fs from 'fs';

// Read the HTML file
const html = fs.readFileSync('/Users/christophersancho/Downloads/birthday-messages copy 2.html', 'utf8');

// Split into individual message blocks
const messages = html.split('<div class="birthday-message">');

// Process each message block
messages.forEach((block, index) => {
  if (index === 0) return; // Skip first split result (before first message)
  
  // Extract components using regex
  const nameMatch = block.match(/<div class="message-author">From: (.*?) 💕<\/div>/);
  const contentMatch = block.match(/<div class="message-content">([\s\S]*?)<\/div>/);
  const imageMatch = block.match(/<img src="(.*?)" alt="Shared memory">/);
  const timeMatch = block.match(/<div class="message-time">(.*?)<\/div>/);

  if (nameMatch && contentMatch) {
    const name = nameMatch[1];
    const message = contentMatch[1].trim();
    const imageUrl = imageMatch ? imageMatch[1] : null;
    const time = timeMatch ? timeMatch[1] : null;

    console.log('\nMessage:', index);
    console.log('From:', name);
    console.log('Content:', message.substring(0, 100), message.length > 100 ? '...' : '');
    if (imageUrl) console.log('Image:', imageUrl);
    if (time) console.log('Time:', time);
  }
});
