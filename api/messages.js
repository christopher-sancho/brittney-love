import { put, list, del } from '@vercel/blob';

const MAX_MESSAGES_PER_FILE = 10;
const MESSAGE_FILE_PREFIX = 'birthday-messages-';

const defaultHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache'
};

// Function to deduplicate and clean messages
function deduplicateMessages(messages) {
  const seen = new Set();
  const cleanMessages = [];
  
  messages.forEach(msg => {
    // Remove messages that claim to have shared a picture but don't have image data
    if (msg.message === "Shared a favorite picture! 📸💕") {
      const hasImageData = msg.image || msg.imageUrl;
      if (!hasImageData) {
        return; // Skip this message - it's a broken image message
      }
    }
    
    // Create a unique key for deduplication
    const key = JSON.stringify({
      name: msg.name?.trim(),
      message: msg.message?.trim(),
      // Include image data for comparison (first 100 chars to avoid huge keys)
      imagePreview: msg.image ? msg.image.substring(0, 100) : null,
      imageUrl: msg.imageUrl,
      hasImage: msg.hasImage
    });
    
    if (!seen.has(key)) {
      seen.add(key);
      cleanMessages.push(msg);
    }
  });
  
  return cleanMessages;
}

async function getCurrentMessageFile() {
  try {
    const { blobs } = await list();
    const messageFiles = blobs
      .filter(blob => blob.pathname.startsWith(MESSAGE_FILE_PREFIX))
      .sort((a, b) => b.pathname.localeCompare(a.pathname));

    if (messageFiles.length === 0) {
      return `${MESSAGE_FILE_PREFIX}1.json`;
    }

    // If this is the first file, allow it to grow larger
    if (messageFiles[0].pathname === `${MESSAGE_FILE_PREFIX}1.json`) {
      return messageFiles[0].pathname;
    }

    // For subsequent files, check if current file is full
    const latestFile = messageFiles[0];
    const response = await fetch(latestFile.url);
    const messages = await response.json();

    if (messages.length >= MAX_MESSAGES_PER_FILE) {
      const currentNum = parseInt(latestFile.pathname.match(/\d+/)[0]);
      return `${MESSAGE_FILE_PREFIX}${currentNum + 1}.json`;
    }

    return latestFile.pathname;
  } catch (error) {
    throw error;
  }
}

async function getAllMessages() {
  try {
    const { blobs } = await list();
    // Include both the old birthday-messages.json and new chunked files
    const messageFiles = blobs.filter(blob => 
      blob.pathname.startsWith(MESSAGE_FILE_PREFIX) || 
      blob.pathname === 'birthday-messages.json'
    );

    const allMessages = await Promise.all(
      messageFiles.map(async file => {
        const response = await fetch(file.url);
        return response.json();
      })
    );

    const flatMessages = allMessages.flat();
    const cleanedMessages = deduplicateMessages(flatMessages);
    
    return cleanedMessages
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    throw error;
  }
}

export async function GET(request) {
  try {
    const messages = await getAllMessages();
    return new Response(JSON.stringify(messages), {
      status: 200,
      headers: defaultHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: defaultHeaders
    });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Handle batch upload
    if (data.messages && data.fileName) {
      const { url } = await put(data.fileName, JSON.stringify(data.messages), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json; charset=utf-8',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        allowOverwrite: true
      });

      return new Response(JSON.stringify({ success: true, url }), {
        status: 200,
        headers: defaultHeaders
      });
    }
    
    // Handle single message
    const currentFile = await getCurrentMessageFile();
    let messages = [];
    try {
      const { blobs } = await list();
      const existingFile = blobs.find(blob => blob.pathname === currentFile);
      if (existingFile) {
        const response = await fetch(existingFile.url);
        messages = await response.json();
      }
    } catch (error) {
      // Continue with empty messages array if file doesn't exist
    }

    // Add id and timestamp to the message
    const newMessage = {
      ...data,
      id: data.id || `${Date.now()}-${Math.random()}`,
      timestamp: data.timestamp || new Date().toISOString()
    };
    messages.push(newMessage);

    const { url } = await put(currentFile, JSON.stringify(messages), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json; charset=utf-8',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      allowOverwrite: true
    });

    return new Response(JSON.stringify({ success: true, message: newMessage }), {
      status: 200,
      headers: defaultHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: defaultHeaders
    });
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: defaultHeaders
  });
}