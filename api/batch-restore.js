import { put } from '@vercel/blob'

// Special endpoint to restore all messages in one batch
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages } = req.body
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages array' })
    }

    console.log(`Batch restore: Processing ${messages.length} messages`)

    // Process all messages
    const processedMessages = []
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      
      // Create new message with unique ID
      const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9) + i
      const processedMessage = {
        name: msg.name,
        message: msg.message,
        id: uniqueId,
        timestamp: msg.originalTimestamp || new Date().toISOString(),
        messageIndex: i + 1
      }

      // Handle image separately to avoid JSON size limits
      if (msg.image) {
        try {
          // Store image as separate blob file
          const imageFileName = `image-${uniqueId}.jpg`
          
          // Convert base64 to buffer for proper storage
          const base64Data = msg.image.replace(/^data:image\/[a-z]+;base64,/, '')
          const imageBuffer = Buffer.from(base64Data, 'base64')
          
          const imageBlob = await put(imageFileName, imageBuffer, {
            access: 'public',
            contentType: 'image/jpeg',
            token: process.env.BLOB_READ_WRITE_TOKEN,
            allowOverwrite: true
          })
          
          // Store only the URL in the message
          processedMessage.imageUrl = imageBlob.url
          processedMessage.hasImage = true
          console.log(`Stored image for ${msg.name}:`, imageBlob.url)
        } catch (imageError) {
          console.error(`Failed to store image for ${msg.name}:`, imageError)
          // Continue without image rather than failing completely
        }
      }

      processedMessages.push(processedMessage)
    }

    // Save all messages as lightweight JSON
    const jsonString = JSON.stringify(processedMessages, null, 2)
    console.log(`Saving batch: ${processedMessages.length} messages, JSON size: ${jsonString.length} chars`)
    
    const blob = await put('birthday-messages.json', jsonString, {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      allowOverwrite: true
    })

    console.log('Batch restore completed successfully')

    return res.status(200).json({ 
      success: true, 
      restoredCount: processedMessages.length,
      blobUrl: blob.url 
    })
  } catch (error) {
    console.error('Batch restore error:', error)
    return res.status(500).json({ 
      error: 'Failed to restore messages batch', 
      details: error.message
    })
  }
}
