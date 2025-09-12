import { put, list } from '@vercel/blob'

// For this birthday app, we'll store messages as JSON in Vercel Blob
const MESSAGES_BLOB_NAME = 'birthday-messages.json'

// Vercel Blob configuration - using your store
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

export default async function handler(req, res) {
  // Enable CORS for frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
  res.setHeader('Content-Type', 'application/json; charset=utf-8') // Ensure UTF-8 encoding

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    if (req.method === 'GET') {
      // Get all messages
      try {
        const { blobs } = await list({ 
          prefix: MESSAGES_BLOB_NAME,
          token: BLOB_READ_WRITE_TOKEN 
        })
        
        if (blobs.length === 0) {
          return res.status(200).json([])
        }

        // Fetch the messages blob
        const response = await fetch(blobs[0].url)
        const messages = await response.json()
        
        return res.status(200).json(messages || [])
      } catch (error) {
        console.log('No existing messages found, returning empty array')
        return res.status(200).json([])
      }
    }

    if (req.method === 'POST') {
      // Add new message
      const newMessage = req.body
      console.log('Received message data:', newMessage) // Debug log
      console.log('Message keys:', Object.keys(newMessage)) // Debug log
      console.log('Name conflicts check:', newMessage.name) // Debug log

      // Get existing messages
      let existingMessages = []
      try {
        const { blobs } = await list({ 
          prefix: MESSAGES_BLOB_NAME,
          token: BLOB_READ_WRITE_TOKEN 
        })
        if (blobs.length > 0) {
          const response = await fetch(blobs[0].url)
          existingMessages = await response.json() || []
        }
      } catch (error) {
        console.log('No existing messages found, starting fresh')
      }

      // Add new message with unique ID and timestamp
      const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9)
      const messageWithId = {
        ...newMessage,
        id: uniqueId,
        timestamp: new Date().toISOString(),
        messageIndex: existingMessages.length + 1 // Sequential number for ordering
      }

      existingMessages.push(messageWithId)

      // Save updated messages back to Vercel Blob
      // Ensure proper emoji/unicode handling
      const jsonString = JSON.stringify(existingMessages, null, 2)
      console.log('Saving JSON data:', jsonString.length, 'characters') // Debug log
      
      const blob = await put(MESSAGES_BLOB_NAME, jsonString, {
        access: 'public',
        contentType: 'application/json; charset=utf-8',
        token: BLOB_READ_WRITE_TOKEN,
        allowOverwrite: true  // Allow updating the existing messages file
      })

      return res.status(200).json({ 
        success: true, 
        message: messageWithId,
        blobUrl: blob.url 
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    console.error('Error stack:', error.stack)
    console.error('BLOB_READ_WRITE_TOKEN present:', !!BLOB_READ_WRITE_TOKEN)
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      hasToken: !!BLOB_READ_WRITE_TOKEN
    })
  }
}
