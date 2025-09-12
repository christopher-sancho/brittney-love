import fs from 'fs';

async function main() {
  // Get the file path from command line argument or use default
  const filePath = process.argv[2] || './final-messages.json';
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const fetch = (await import('node-fetch')).default;
  
  try {
    // Read the messages to restore
    const messages = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`📖 Read ${messages.length} messages from ${filePath}`);

    // Create a backup of current production state
    console.log('\n📡 Fetching current production state...');
    const prodResponse = await fetch('https://brittney-love.vercel.app/api/messages');
    const prodMessages = await prodResponse.json();
    
    // Save production backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupsDir = './backups';
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir);
    }
    const backupPath = `${backupsDir}/prod-backup-${timestamp}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(prodMessages, null, 2));
    console.log(`💾 Saved production backup to ${backupPath}`);

    // Upload the messages
    console.log('\n🚀 Uploading messages...');
    const response = await fetch('https://brittney-love.vercel.app/api/direct-restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }) // Wrap messages in an object
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, details: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('\n✅ Successfully restored messages!');
    console.log(`📊 Stats: ${result.restoredCount} messages uploaded`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();