import { put } from '@vercel/blob'

// Direct restore endpoint - replaces entire messages JSON
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

    console.log(`Direct restore: Replacing with ${messages.length} messages`)

    // Directly save the complete messages array (no appending, just replace)
    const jsonString = JSON.stringify(messages, null, 2)
    console.log(`Saving complete JSON: ${jsonString.length} characters`)
    
    const blob = await put('birthday-messages.json', jsonString, {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      allowOverwrite: true
    })

    console.log('Direct restore completed successfully')

    return res.status(200).json({ 
      success: true, 
      restoredCount: messages.length,
      blobUrl: blob.url 
    })
  } catch (error) {
    console.error('Direct restore error:', error)
    return res.status(500).json({ 
      error: 'Failed to restore messages', 
      details: error.message
    })
  }
}
