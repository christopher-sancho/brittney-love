import { put, list, del } from '@vercel/blob';
import { NextResponse } from 'next/server';

const MAX_MESSAGES_PER_FILE = 10;
const MESSAGE_FILE_PREFIX = 'birthday-messages-';

async function getCurrentMessageFile() {
  try {
    const { blobs } = await list();
    const messageFiles = blobs
      .filter(blob => blob.pathname.startsWith(MESSAGE_FILE_PREFIX))
      .sort((a, b) => b.pathname.localeCompare(a.pathname));

    if (messageFiles.length === 0) {
      return `${MESSAGE_FILE_PREFIX}1.json`;
    }

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
    const messageFiles = blobs.filter(blob => blob.pathname.startsWith(MESSAGE_FILE_PREFIX));

    const allMessages = await Promise.all(
      messageFiles.map(async file => {
        const response = await fetch(file.url);
        return response.json();
      })
    );

    return allMessages
      .flat()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    throw error;
  }
}

export async function GET(request) {
  try {
    const messages = await getAllMessages();
    return new NextResponse(JSON.stringify(messages), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const messageData = await request.json();
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

    messages.push({
      ...messageData,
      timestamp: new Date().toISOString()
    });

    const { url } = await put(currentFile, JSON.stringify(messages), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json; charset=utf-8',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      allowOverwrite: true
    });

    return new NextResponse(JSON.stringify({ success: true, url }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}