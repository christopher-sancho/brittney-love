import fs from 'fs';

// Read both backup files
const jsonBackup = JSON.parse(fs.readFileSync('/Users/christophersancho/Downloads/birthday-messages.json', 'utf8'));
const htmlBackup = fs.readFileSync('/Users/christophersancho/Downloads/birthday-messages copy 2.html', 'utf8');

console.log(`Found ${jsonBackup.length} messages in JSON backup`);

// Extract messages from HTML backup
function extractMessagesFromHTML(html) {
  const messages = [];
  const messageRegex = /<div class="birthday-message">([\s\S]*?)<\/div>/g;
  const nameRegex = /<div class="message-author">From: (.*?) 💕<\/div>/;
  const contentRegex = /<div class="message-content">([\s\S]*?)<\/div>/;
  const imageRegex = /<img src="(.*?)" alt="Shared memory">/;
  const timeRegex = /<div class="message-time">(.*?)<\/div>/;

  let match;
  while ((match = messageRegex.exec(html)) !== null) {
    const messageHtml = match[1];
    const name = (messageHtml.match(nameRegex) || [])[1];
    const message = (messageHtml.match(contentRegex) || [])[1];
    const imageUrl = (messageHtml.match(imageRegex) || [])[1];
    const timestamp = (messageHtml.match(timeRegex) || [])[1];

    if (name && message) {
      messages.push({
        name,
        message,
        imageUrl,
        timestamp: new Date(timestamp).toISOString(),
        id: Date.now() + Math.random().toString(36).substr(2, 9)
      });
    }
  }

  return messages;
}

const htmlMessages = extractMessagesFromHTML(htmlBackup);
console.log(`Found ${htmlMessages.length} messages in HTML backup`);

// Merge messages from both sources, preferring HTML backup for duplicates
// (since it represents what was actually displayed)
const allMessages = [...htmlMessages];

// Add any JSON messages that aren't in HTML backup
jsonBackup.forEach(jsonMsg => {
  const isDuplicate = allMessages.some(htmlMsg => 
    htmlMsg.name === jsonMsg.name && 
    htmlMsg.message === jsonMsg.message
  );
  
  if (!isDuplicate) {
    allMessages.push({
      ...jsonMsg,
      id: jsonMsg.id || Date.now() + Math.random().toString(36).substr(2, 9)
    });
  }
});

console.log(`Combined total: ${allMessages.length} unique messages`);

// Filter out test messages but be less aggressive
const realMessages = allMessages.filter(msg => {
  // Skip only obvious test messages
  const isTest = 
    (msg.name === 'chris' && msg.message === 'i love her') ||
    (msg.name === 'i love her ') ||
    msg.message.toLowerCase().includes('test message');
  
  if (isTest) {
    console.log('Skipping test message:', msg.name, msg.message.substring(0, 20));
    return false;
  }
  
  console.log('Keeping message:', msg.name, msg.message.substring(0, 30), msg.imageUrl ? '[HAS IMAGE URL]' : (msg.image ? '[HAS BASE64]' : ''));
  return true;
});

console.log(`\nFiltered to ${realMessages.length} real messages`);

// Function to restore a message via API
async function restoreMessage(message) {
  const fetch = (await import('node-fetch')).default;
  try {
    // If we have an imageUrl, use that directly
    if (message.imageUrl) {
      const response = await fetch('https://brittney-love.vercel.app/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: message.name,
          message: message.message,
          imageUrl: message.imageUrl,
          hasImage: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Restored message with imageUrl from ${message.name}`);
        return result;
      }
    }
    // If we have base64 image data, let the API handle it
    else if (message.image) {
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
        console.log(`✅ Restored message with base64 image from ${message.name}`);
        return result;
      }
    }
    // Text-only message
    else {
      const response = await fetch('https://brittney-love.vercel.app/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: message.name,
          message: message.message
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Restored text message from ${message.name}`);
        return result;
      }
    }

    console.log(`❌ Failed to restore message from ${message.name}`);
    return null;
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
    console.log(`\nRestoring ${i + 1}/${realMessages.length}: ${message.name}`);
    console.log('Message:', message.message.substring(0, 50));
    if (message.imageUrl) console.log('Has image URL:', message.imageUrl);
    if (message.image) console.log('Has base64 image data');
    
    await restoreMessage(message);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 Restoration complete!');
}

// Show the messages that will be restored
console.log('\n📝 Messages to restore:');
realMessages.forEach((msg, i) => {
  console.log(`${i + 1}. ${msg.name}: "${msg.message.substring(0, 50)}..." ${msg.imageUrl ? '[URL IMAGE]' : (msg.image ? '[BASE64 IMAGE]' : '')}`);
});

console.log('\n🚀 Starting restoration in 5 seconds...');
setTimeout(restoreAll, 5000);
