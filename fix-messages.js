import fs from 'fs';
import sharp from 'sharp';

// Read the accurate messages
const accurateMessages = JSON.parse(fs.readFileSync('./final-messages-3.json', 'utf8'));

// Create backup of current production state
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = './backups';
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Function to compress base64 image
async function compressImage(base64Data) {
  // Extract image data from base64 string
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 data');
  }

  const actualData = matches[2];
  const buffer = Buffer.from(actualData, 'base64');

  // Compress image using sharp
  const compressedBuffer = await sharp(buffer)
    .resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 60 })
    .toBuffer();

  // Convert back to base64
  return `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
}

// Function to restore messages
async function fixMessages() {
  try {
    // First save backup of current production state
    const prodResponse = await fetch('https://brittney-love.vercel.app/api/messages');
    const prodMessages = await prodResponse.json();
    fs.writeFileSync(`${backupDir}/prod-backup-${timestamp}.json`, JSON.stringify(prodMessages, null, 2));
    console.log('Created backup of current production state');

    // Get messages from final-messages-3.json
    const messages = accurateMessages;

    // Upload images to Vercel Blob and update imageUrls
    for (const message of messages) {
      if (message.image) {
        try {
          // Compress image before uploading
          const compressedImage = await compressImage(message.image);

          // Upload compressed image to Vercel Blob
          const response = await fetch('https://brittney-love.vercel.app/api/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ base64Data: compressedImage }),
          });

          if (!response.ok) {
            throw new Error(`Failed to upload image: ${response.status}`);
          }

          const { url } = await response.json();
          message.imageUrl = url;
          delete message.image; // Remove base64 data
          message.hasImage = true;

          console.log(`Successfully uploaded image for message ${message.id}`);
        } catch (error) {
          console.error(`Error processing image for message ${message.id}:`, error);
          // Skip this image but continue with others
          delete message.image;
        }
      }
    }

    // Now restore all messages
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
    console.error('Error fixing messages:', error);
  }
}

fixMessages();