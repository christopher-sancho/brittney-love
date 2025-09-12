import { put } from '@vercel/blob'

// Simple admin endpoint to reset messages for the birthday
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
    // Reset to empty array
    const emptyMessages = []
    const jsonString = JSON.stringify(emptyMessages, null, 2)
    
    const blob = await put('birthday-messages.json', jsonString, {
      access: 'public',
      contentType: 'application/json; charset=utf-8',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      allowOverwrite: true
    })

    console.log('Messages reset successfully')

    return res.status(200).json({ 
      success: true, 
      message: 'Messages reset successfully',
      messageCount: 0,
      blobUrl: blob.url 
    })
  } catch (error) {
    console.error('Reset Error:', error)
    return res.status(500).json({ 
      error: 'Failed to reset messages', 
      details: error.message
    })
  }
}
