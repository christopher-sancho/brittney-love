export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  try {
    // Get messages from the existing API
    const response = await fetch('https://brittney-love.vercel.app/api/messages')
    const messages = await response.json()
    
    // Find messages with images
    const messagesWithImages = messages.filter(msg => msg.image || msg.imageUrl)
    
    const imageInfo = messagesWithImages.map(msg => ({
      name: msg.name,
      hasImage: !!msg.image,
      hasImageUrl: !!msg.imageUrl,
      imageSize: msg.image ? msg.image.length : 0,
      imageType: msg.image ? msg.image.substring(0, 30) : null
    }))

    return res.status(200).json({
      totalMessages: messages.length,
      messagesWithImages: messagesWithImages.length,
      imageInfo
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
