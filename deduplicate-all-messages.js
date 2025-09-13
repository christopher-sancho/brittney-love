import fs from 'fs';
import { fetch } from 'undici';

async function deduplicateAllMessages() {
    try {
        // Create backup first
        const backupDir = './backups';
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Get all current messages from API
        console.log('Fetching all messages from API...');
        const response = await fetch('https://brittney-love.vercel.app/api/messages');
        const allMessages = await response.json();
        
        // Create backup
        fs.writeFileSync(`${backupDir}/before-dedup-${timestamp}.json`, JSON.stringify(allMessages, null, 2));
        console.log(`Created backup: ${backupDir}/before-dedup-${timestamp}.json`);
        console.log(`Total messages before deduplication: ${allMessages.length}`);
        
        // Deduplicate by creating a unique key for each message
        const seen = new Set();
        const uniqueMessages = [];
        const duplicates = [];
        
        allMessages.forEach((msg, index) => {
            // Create a comprehensive key that includes all relevant fields
            const key = JSON.stringify({
                name: msg.name?.trim(),
                message: msg.message?.trim(),
                // Include image data for comparison (first 100 chars to avoid huge keys)
                imagePreview: msg.image ? msg.image.substring(0, 100) : null,
                imageUrl: msg.imageUrl,
                hasImage: msg.hasImage
            });
            
            if (seen.has(key)) {
                duplicates.push({
                    index,
                    name: msg.name,
                    message: msg.message.substring(0, 50) + '...',
                    timestamp: msg.timestamp
                });
            } else {
                seen.add(key);
                uniqueMessages.push(msg);
            }
        });
        
        console.log(`\nDuplication analysis:`);
        console.log(`- Unique messages: ${uniqueMessages.length}`);
        console.log(`- Duplicates found: ${duplicates.length}`);
        
        if (duplicates.length > 0) {
            console.log(`\nDuplicates to be removed:`);
            duplicates.forEach(dup => {
                console.log(`- ${dup.name}: "${dup.message}" (${dup.timestamp})`);
            });
        }
        
        // Sort unique messages by timestamp (newest first)
        uniqueMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Add missing IDs if needed
        uniqueMessages.forEach(msg => {
            if (!msg.id) {
                msg.id = `${Date.now()}${Math.random().toString(36).substring(2)}`;
            }
        });
        
        console.log(`\nFinal message count: ${uniqueMessages.length}`);
        
        // Count messages with images
        const messagesWithImages = uniqueMessages.filter(msg => msg.image || msg.imageUrl);
        console.log(`Messages with images: ${messagesWithImages.length}`);
        
        // Upload the deduplicated messages
        console.log('\nUploading deduplicated messages...');
        const uploadResponse = await fetch('https://brittney-love.vercel.app/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: uniqueMessages,
                fileName: 'birthday-messages-1.json'
            })
        });
        
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Failed to upload deduplicated messages: ${uploadResponse.statusText} - ${errorText}`);
        }
        
        console.log('✅ Successfully deduplicated messages!');
        console.log(`Removed ${duplicates.length} duplicate messages`);
        console.log(`Final count: ${uniqueMessages.length} unique messages`);
        
    } catch (error) {
        console.error('Error during deduplication:', error);
    }
}

deduplicateAllMessages();
