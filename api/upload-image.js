import { put } from '@vercel/blob'

// Vercel Blob configuration
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN

export default async function handler(req, res) {
  // Enable CORS for frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageData, fileName } = req.body

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' })
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Generate unique filename
    const uniqueFileName = `birthday-images/${Date.now()}-${fileName || 'image.jpg'}`
    
    // Upload to Vercel Blob
    const blob = await put(uniqueFileName, buffer, {
      access: 'public',
      contentType: imageData.match(/^data:([^;]+);/)?.[1] || 'image/jpeg',
      token: BLOB_READ_WRITE_TOKEN,
      allowOverwrite: true  // Allow overwriting if same filename somehow generated
    })

    return res.status(200).json({ 
      success: true, 
      imageUrl: blob.url,
      fileName: uniqueFileName
    })

  } catch (error) {
    console.error('Image upload error:', error)
    res.status(500).json({ error: 'Failed to upload image', details: error.message })
  }
}
