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

      // Add new message with ID and timestamp
      const messageWithId = {
        ...newMessage,
        id: Date.now(),
        timestamp: new Date().toISOString()
      }

      existingMessages.push(messageWithId)

      // Save updated messages back to Vercel Blob
      const blob = await put(MESSAGES_BLOB_NAME, JSON.stringify(existingMessages), {
        access: 'public',
        contentType: 'application/json',
        token: BLOB_READ_WRITE_TOKEN
      })

      return res.status(200).json({ 
        success: true, 
        message: messageWithId,
        blobUrl: blob.url 
      })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
