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
      const { name, message, image } = req.body
      console.log('Received message - name:', name, 'message length:', message?.length, 'has image:', !!image)

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

      // Create new message with unique ID
      const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9)
      const messageWithId = {
        name,
        message,
        id: uniqueId,
        timestamp: new Date().toISOString(),
        messageIndex: existingMessages.length + 1
      }

      // Handle image separately to avoid JSON size limits
      if (image) {
        try {
          // Store image as separate blob file
          const imageFileName = `image-${uniqueId}.jpg`
          
          // Convert base64 to buffer for proper storage
          const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '')
          const imageBuffer = Buffer.from(base64Data, 'base64')
          
          const imageBlob = await put(imageFileName, imageBuffer, {
            access: 'public',
            contentType: 'image/jpeg',
            token: BLOB_READ_WRITE_TOKEN,
            allowOverwrite: true
          })
          
          // Store only the URL in the message (much smaller)
          messageWithId.imageUrl = imageBlob.url
          messageWithId.hasImage = true
          console.log('Stored image separately at:', imageBlob.url)
        } catch (imageError) {
          console.error('Failed to store image:', imageError)
          // Continue without image rather than failing completely
        }
      }

      existingMessages.push(messageWithId)

      // Save lightweight JSON (no base64 images, just URLs)
      const jsonString = JSON.stringify(existingMessages, null, 2)
      console.log('Lightweight JSON size:', jsonString.length, 'characters')
      
      const blob = await put(MESSAGES_BLOB_NAME, jsonString, {
        access: 'public',
        contentType: 'application/json; charset=utf-8',
        token: BLOB_READ_WRITE_TOKEN,
        allowOverwrite: true
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
