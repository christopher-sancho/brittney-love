import fs from 'fs';
import path from 'path';

async function main() {
  const fetch = (await import('node-fetch')).default;

  // Create backups directory if it doesn't exist
  const backupsDir = './backups';
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir);
  }

  // First get current production messages
  console.log('📡 Fetching current production messages...');
  const prodResponse = await fetch('https://brittney-love.vercel.app/api/messages');
  const prodMessages = await prodResponse.json();
  console.log(`Found ${prodMessages.length} messages in production`);

  // Identify recent messages (last 24 hours) to preserve them
  const now = new Date();
  const recentMessages = prodMessages.filter(msg => {
    const msgDate = new Date(msg.timestamp);
    const hoursSince = (now - msgDate) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      console.log(`Found recent message from ${msg.name} (${hoursSince.toFixed(1)} hours ago)`);
      return true;
    }
    return false;
  });

  // Save current production state as backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  let backupNumber = 1;
  while (fs.existsSync(path.join(backupsDir, `backup-${backupNumber}.json`))) {
    backupNumber++;
  }
  const backupPath = path.join(backupsDir, `backup-${backupNumber}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(prodMessages, null, 2));
  console.log(`\n💾 Saved current production state to ${backupPath}`);

  // Read backup files
  const jsonBackup = JSON.parse(fs.readFileSync('/Users/christophersancho/Downloads/birthday-messages.json', 'utf8'));
  const htmlBackup = fs.readFileSync('/Users/christophersancho/Downloads/birthday-messages copy 2.html', 'utf8');

  console.log(`Found ${jsonBackup.length} messages in JSON backup`);

  // Function to decode HTML entities
  const decodeHTML = (html) => {
    if (!html) return '';
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/")
      .replace(/&#39;/g, "'")
      .replace(/&#47;/g, "/");
  };

  // Extract messages from HTML backup
  function extractMessagesFromHTML(html) {
    const messages = [];
    const blocks = html.split('<div class="birthday-message">');
    
    blocks.forEach((block, index) => {
      if (index === 0) return; // Skip first split result
      
      const nameMatch = block.match(/<div class="message-author">From: (.*?) 💕<\/div>/);
      const contentMatch = block.match(/<div class="message-content">([\s\S]*?)<\/div>/);
      const imageMatch = block.match(/<img src="(.*?)" alt="Shared memory">/);
      const timeMatch = block.match(/<div class="message-time">(.*?)<\/div>/);

      if (nameMatch && contentMatch) {
        const name = decodeHTML(nameMatch[1].trim());
        const message = decodeHTML(contentMatch[1].trim());
        const imageUrl = imageMatch ? imageMatch[1] : null;
        const timestamp = timeMatch ? new Date(timeMatch[1]).toISOString() : new Date().toISOString();

        messages.push({
          name,
          message,
          imageUrl,
          timestamp,
          id: Date.now() + Math.random().toString(36).substr(2, 9)
        });
      }
    });

    return messages;
  }

  const htmlMessages = extractMessagesFromHTML(htmlBackup);
  console.log(`Found ${htmlMessages.length} messages in HTML backup`);

  // Combine all messages
  const allMessages = [
    ...prodMessages.filter(msg => !recentMessages.includes(msg)), // Older production messages
    ...jsonBackup,
    ...htmlMessages
  ];

  console.log(`\nCombined total: ${allMessages.length} messages`);

  // Function to normalize text for comparison
  const normalizeText = (text) => {
    if (!text) return '';
    return decodeHTML(text)
      .replace(/[\s\u{200B}-\u{200D}\uFEFF}]/gu, ' ') // Replace special whitespace with normal space
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim()
      .toLowerCase();
  };

  // Function to get message signature for deduplication
  const getMessageSignature = (msg) => {
    const normalizedName = normalizeText(msg.name);
    const normalizedMessage = normalizeText(msg.message);
    
    // For image messages, include image presence in signature
    const hasImage = !!(msg.imageUrl || msg.image);
    const imageType = msg.imageUrl ? 'url' : (msg.image ? 'base64' : 'none');
    
    return `${normalizedName}|${normalizedMessage}|${hasImage}|${imageType}`;
  };

  // Deduplicate messages
  const messageMap = new Map();
  allMessages.forEach(msg => {
    const signature = getMessageSignature(msg);
    
    // If we've seen this message before, keep the one with more information
    if (messageMap.has(signature)) {
      const existing = messageMap.get(signature);
      
      // Prefer messages with URLs over base64 images
      if (msg.imageUrl && !existing.imageUrl) {
        messageMap.set(signature, msg);
      }
      // If both have same image type, prefer the one with an ID
      else if (msg.id && !existing.id) {
        messageMap.set(signature, msg);
      }
      // Otherwise keep the existing one
    } else {
      messageMap.set(signature, msg);
    }
  });

  // Convert back to array and add recent messages
  let uniqueMessages = [
    ...Array.from(messageMap.values()),
    ...recentMessages // Add recent messages back in
  ];

  console.log(`\nDeduped to ${uniqueMessages.length} unique messages (including ${recentMessages.length} recent messages)`);

  // Filter out invalid messages
  const realMessages = uniqueMessages.filter(msg => {
    // Skip filtering recent messages - keep them all
    if (recentMessages.includes(msg)) return true;

    // Normalize message and name for checking
    const msgNorm = normalizeText(msg.message);
    const nameNorm = normalizeText(msg.name);

    // Skip messages that are clearly invalid
    const isInvalid = 
      // Empty or missing content
      !msgNorm ||
      !nameNorm ||
      
      // Single word responses that are likely navigation artifacts
      msgNorm === 'yes' ||
      msgNorm === 'no' ||
      
      // Known test messages from debugging
      nameNorm === 'chris' || // Remove all messages from chris (test account)
      nameNorm === 'i love her' ||
      msgNorm.includes('test') ||
      nameNorm.includes('debugger') ||
      nameNorm === 'i add' ||
      
      // Navigation questions
      msgNorm === 'are you working?' ||
      msgNorm === 'images' ||
      msgNorm === 'can it be a photo?';
    
    if (isInvalid) {
      console.log('Skipping invalid message:', msg.name, msg.message.substring(0, 20));
      return false;
    }
    
    return true;
  });

  console.log(`\nFiltered to ${realMessages.length} real messages`);

  // Sort messages by timestamp
  realMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Group messages by sender for display
  const messagesByName = {};
  realMessages.forEach(msg => {
    if (!messagesByName[msg.name]) {
      messagesByName[msg.name] = [];
    }
    messagesByName[msg.name].push(msg);
  });

  // Show the messages that will be restored
  console.log('\n📝 Messages to restore:');
  Object.entries(messagesByName).forEach(([name, messages]) => {
    console.log(`\n${name} (${messages.length} messages):`);
    messages.forEach((msg, i) => {
      const isRecent = recentMessages.includes(msg);
      console.log(`  ${i + 1}. (${new Date(msg.timestamp).toLocaleDateString()}): "${msg.message.substring(0, 50)}..." ${msg.imageUrl ? '[URL IMAGE]' : (msg.image ? '[BASE64 IMAGE]' : '')}${isRecent ? ' [RECENT]' : ''}`);
    });
  });

  // Save the final messages with an incremented number
  let finalNumber = 1;
  while (fs.existsSync(`./final-messages-${finalNumber}.json`)) {
    finalNumber++;
  }
  const finalMessagesPath = `./final-messages-${finalNumber}.json`;
  fs.writeFileSync(finalMessagesPath, JSON.stringify(realMessages, null, 2));
  console.log(`\n💾 Wrote final messages to ${finalMessagesPath} for review`);

  // Also save a timestamped copy in backups
  const finalBackupPath = path.join(backupsDir, `final-messages-${timestamp}.json`);
  fs.writeFileSync(finalBackupPath, JSON.stringify(realMessages, null, 2));
  console.log(`📦 Saved backup copy to ${finalBackupPath}`);

  console.log('\n⚠️ Please review the messages in the final file');
  console.log('Once confirmed, use the direct-restore.js script to upload them:');
  console.log(`node direct-restore.js ${finalMessagesPath}`);
}

main().catch(console.error);