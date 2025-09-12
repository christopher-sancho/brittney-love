// Simple service for Vercel Blob storage
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-app-name.vercel.app/api' 
  : '/api'

/**
 * Save a message using Vercel API
 * @param {Object} message - The message object
 * @returns {Promise} - Promise that resolves when message is saved
 */
export const saveMessage = async (message) => {
  try {
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('Message saved successfully:', result)
    return result
  } catch (error) {
    console.error('Error saving message:', error)
    throw error
  }
}

/**
 * Get all messages from Vercel API
 * @returns {Promise<Array>} - Promise that resolves to array of messages
 */
export const getAllMessages = async () => {
  try {
    const response = await fetch(`${API_BASE}/messages`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const messages = await response.json()
    return messages || []
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw error
  }
}

/**
 * Upload an image to Vercel Blob
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} fileName - Optional filename
 * @returns {Promise<string>} - Promise that resolves to the image URL
 */
export const uploadImage = async (base64Data, fileName = null) => {
  try {
    const response = await fetch(`${API_BASE}/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: base64Data,
        fileName: fileName
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result.imageUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

/**
 * Save a message with an image
 * @param {Object} messageData - The message data
 * @param {string} base64ImageData - Base64 encoded image data
 * @returns {Promise} - Promise that resolves when both are saved
 */
export const saveMessageWithImage = async (messageData, base64ImageData) => {
  try {
    // First upload the image
    const imageUrl = await uploadImage(base64ImageData)
    
    // Then save the message with the image URL
    const messageWithImage = {
      ...messageData,
      image: imageUrl,
      hasImage: true
    }
    
    return await saveMessage(messageWithImage)
  } catch (error) {
    console.error('Error saving message with image:', error)
    throw error
  }
}
