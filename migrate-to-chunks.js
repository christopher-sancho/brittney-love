import fs from 'fs';

const accurateMessages = JSON.parse(fs.readFileSync('./final-messages-3.json', 'utf8'));

const messageChunks = [];
for (let i = 0; i < accurateMessages.length; i += 10) {
    messageChunks.push(accurateMessages.slice(i, i + 10));
}

const backupDir = './backups';
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

async function migrateMessages() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const prodResponse = await fetch('https://brittney-love.vercel.app/api/messages');
        const prodMessages = await prodResponse.json();
        fs.writeFileSync(`${backupDir}/prod-backup-${timestamp}.json`, JSON.stringify(prodMessages, null, 2));

        for (let i = 0; i < messageChunks.length; i++) {
            const chunk = messageChunks[i];
            
            const response = await fetch('https://brittney-love.vercel.app/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chunk[0])
            });

            if (!response.ok) {
                throw new Error(`Failed to upload chunk ${i + 1}`);
            }

            for (let j = 1; j < chunk.length; j++) {
                const msgResponse = await fetch('https://brittney-love.vercel.app/api/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(chunk[j])
                });

                if (!msgResponse.ok) {
                    throw new Error(`Failed to upload message ${j} in chunk ${i + 1}`);
                }
            }
        }
    } catch (error) {
        throw error;
    }
}

migrateMessages();