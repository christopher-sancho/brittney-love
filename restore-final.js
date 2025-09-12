import fs from 'fs';

// Read the accurate messages
const messages = JSON.parse(fs.readFileSync('./final-messages-3.json', 'utf8'));

// Create backup of current production state
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = './backups';
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Function to restore messages
async function restoreMessages() {
  try {
    // First save backup of current production state
    const prodResponse = await fetch('https://brittney-love.vercel.app/api/messages');
    const prodMessages = await prodResponse.json();
    fs.writeFileSync(`${backupDir}/prod-backup-${timestamp}.json`, JSON.stringify(prodMessages, null, 2));
    console.log('Created backup of current production state');

    // Now restore the accurate messages
    const response = await fetch('https://brittney-love.vercel.app/api/direct-restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Successfully restored messages:', result);

  } catch (error) {
    console.error('Error restoring messages:', error);
  }
}

restoreMessages();
