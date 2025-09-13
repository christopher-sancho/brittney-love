import { useState, useEffect, useRef } from 'react'
import './App.css'
import { saveMessage, getMessages, saveMessageWithImage } from './vercelService'

// Helper function to compress images
const compressImage = (file, quality = 0.6) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // More aggressive sizing for faster loading (max 600px)
      const maxSize = 600
      let { width, height } = img
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Use better image smoothing for quality
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedBase64)
    }
    
    img.src = URL.createObjectURL(file)
  })
}

function App() {
  const [step, setStep] = useState('welcome')
  const [userName, setUserName] = useState('')
  const [currentMessage, setCurrentMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Load messages from Vercel on component mount
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const vercelMessages = await getMessages()
        setMessages(vercelMessages)
      } catch (error) {
        // Only use localStorage if server request fails
        const savedMessages = localStorage.getItem('brittney-birthday-messages')
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages))
        }
      }
    }
    
    loadMessages()
  }, [])

  // Auto-scroll to bottom when new chat messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Add a chat message with typing animation
  const addChatMessage = (text, isUser = false, delay = 1000) => {
    setTimeout(() => {
      setChatMessages(prev => [...prev, { text, isUser, timestamp: Date.now() }])
    }, delay)
  }

  // Initialize welcome flow
  useEffect(() => {
    if (step === 'welcome') {
      setChatMessages([])
      addChatMessage("Hey there! 👋", false, 500)
      addChatMessage("I'm here to help collect some special birthday messages for Brittney! 🎉💕", false, 1500)
      addChatMessage("First, let me ask - are you Savanna Brittney Sancho (nee Ramkissoon)?", false, 3000)
    }
  }, [step])

  const handleNameResponse = (isBrittney) => {
    if (isBrittney) {
      addChatMessage("Yes, that's me! 💕", true, 0)
      addChatMessage("Hi Brittney! 🥳✨", false, 1000)
      addChatMessage("Happy Birthday, beautiful! 🎂💕", false, 2000)
      addChatMessage("Here are some wonderful messages from your favorite people:", false, 3500)
      setTimeout(() => setStep('view-messages'), 4500)
    } else {
      addChatMessage("No, that's not me", true, 0)
      addChatMessage("Perfect! What's your name? 😊", false, 1000)
      setTimeout(() => setStep('name-check'), 2000)
    }
  }

  const handleNameSubmit = (e) => {
    e.preventDefault()
    if (userName.trim()) {
      addChatMessage(userName, true, 0)
      addChatMessage(`Nice to meet you, ${userName}! 😊`, false, 1000)
      addChatMessage("What would you like to share for Brittney's birthday? 🎉", false, 2500)
      setTimeout(() => setStep('ask-more-content'), 3500)
    }
  }

  const handleMessageSubmit = async (e) => {
    e.preventDefault()
    if (currentMessage.trim()) {
      const newMessage = {
        name: userName,
        message: currentMessage,
        timestamp: new Date().toISOString()
      }
      
      try {
        // Save to Vercel
        const result = await saveMessage(newMessage)
        
        // Only update local state after successful save
        const savedMessage = result.message
        const updatedMessages = await getMessages() // Get fresh messages from server
        setMessages(updatedMessages)
        
        addChatMessage(currentMessage, true, 0)
        addChatMessage("Thank you so much! ❤️ Your message has been saved for Brittney's birthday! 🎉", false, 1000)
        addChatMessage("Would you like to upload a photo or write another message? 😊", false, 2500)
        
        // Reset form
        setCurrentMessage('')
        setSelectedImage(null)
        setTimeout(() => setStep('ask-more-content'), 3500)
        
      } catch (error) {
        addChatMessage(currentMessage, true, 0)
        addChatMessage("Sorry, there was an issue saving your message. Please try again! 💕", false, 1000)
      }
    }
  }

  const handleAnotherMemory = (wantsAnother) => {
    if (wantsAnother) {
      addChatMessage("Yes, I'd love to share another! 💕", true, 0)
      addChatMessage("Wonderful! What else would you like to share about Brittney? 🥰", false, 1000)
      setTimeout(() => setStep('collect-message'), 2000)
    } else {
      addChatMessage("No, that's all for now 😊", true, 0)
      addChatMessage("Perfect! Would you like to share a favorite picture of Brittney? 📸✨", false, 1000)
      setTimeout(() => setStep('ask-picture'), 2500)
    }
  }

  const handleMoreContent = (choice) => {
    if (choice === 'photo') {
      addChatMessage("📸 Share a photo", true, 0)
      addChatMessage("Great! Please select a picture of Brittney 📷💕", false, 1000)
      setTimeout(() => setStep('ask-picture'), 2000)
    } else if (choice === 'message') {
      addChatMessage("📝 Write a message", true, 0)
      addChatMessage("Perfect! Share a loving message, favorite memory, or something special about Brittney! 💕", false, 1000)
      setTimeout(() => setStep('collect-message'), 2000)
    } else {
      addChatMessage("All done! 😊", true, 0)
      addChatMessage("Thank you so much for sharing! Brittney is going to love everything! 🎉💕", false, 1000)
      setTimeout(() => {
        setStep('welcome')
        setUserName('')
      }, 3000)
    }
  }

  const handlePictureResponse = (wantsPicture) => {
    if (wantsPicture) {
      addChatMessage("Yes, I'd love to share a picture! 📸", true, 0)
      addChatMessage("Amazing! Please select your favorite picture of Brittney below 💕", false, 1000)
      setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = '' // Reset input
          fileInputRef.current.click()
        }
      }, 2000)
    } else {
      addChatMessage("No pictures this time 😊", true, 0)
      addChatMessage("That's perfectly fine! Thank you so much for your beautiful message! 🎉💕", false, 1000)
      addChatMessage("Brittney is going to be so happy! 🥰", false, 2500)
      setTimeout(() => {
        setStep('welcome')
        setUserName('')
      }, 4000)
    }
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        addChatMessage("Uploading your beautiful picture... 📸✨", false, 500)
        
        // Convert file to base64 and compress if needed
        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            let base64Data = event.target.result
            
            // Compress image if it's too large
            if (base64Data.length > 2000000) {
              base64Data = await compressImage(file, 0.6)
            }
            
            // Save the image with a message to Vercel
            const imageMessage = {
              name: userName,
              message: "Shared a favorite picture! 📸💕",
              timestamp: new Date().toISOString()
            }
            
            await saveMessageWithImage(imageMessage, base64Data)
            
            // Refresh messages from server
            const updatedMessages = await getMessages()
            setMessages(updatedMessages)
            
            addChatMessage("Perfect! Your picture has been added! 📸✨", false, 2000)
            addChatMessage("Thank you for sharing such a beautiful memory! 💕", false, 3500)
            addChatMessage("Would you like to upload another photo or write a message? 😊", false, 5000)
            
            setTimeout(() => setStep('ask-more-content'), 6000)
            
          } catch (error) {
            addChatMessage("Sorry, there was an issue uploading your picture. Please try again! 😊", false, 1000)
          }
        }
        reader.readAsDataURL(file)
        
      } catch (error) {
        addChatMessage("Sorry, there was an issue with the image. Please try again! 😊", false, 1000)
      }
    }
  }

  return (
    <div className="app">
      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span className="time">
            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>
        <div className="status-center">
          <div className="notch"></div>
        </div>
        <div className="status-right">
          <div className="battery">
            <div className="battery-level"></div>
          </div>
          <span className="signal">📶</span>
        </div>
      </div>

      {/* Header */}
      <div className="header">
        <div className="contact-info">
          <div className="avatar">
            💕
          </div>
          <div className="contact-details">
            <div className="contact-name">Birthday Messages</div>
            <div className="contact-status">for Brittney ✨</div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {step === 'view-messages' ? (
          <div className="birthday-messages">
            <div className="birthday-header">
              <h2>💕 Happy Birthday Brittney! 🎂</h2>
              <p>Messages from people who love you:</p>
            </div>
            {messages.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet! Share the link with friends and family! 💕</p>
              </div>
            ) : (
              <div className="messages-list">
                {(() => {
                  // Deduplicate messages with same image URL, preferring named people over "Family"
                  const seenImageUrls = new Set();
                  const deduplicatedMessages = [];
                  
                  // First pass: add messages from named people (not "Family")
                  messages.forEach(msg => {
                    if (msg.imageUrl || msg.image) {
                      const imageUrl = msg.imageUrl || msg.image;
                      if (!seenImageUrls.has(imageUrl) && msg.name !== 'Family') {
                        seenImageUrls.add(imageUrl);
                        deduplicatedMessages.push(msg);
                      }
                    } else {
                      // Always include messages without images
                      deduplicatedMessages.push(msg);
                    }
                  });
                  
                  // Second pass: add "Family" messages only if image URL not already seen
                  messages.forEach(msg => {
                    if ((msg.imageUrl || msg.image) && msg.name === 'Family') {
                      const imageUrl = msg.imageUrl || msg.image;
                      if (!seenImageUrls.has(imageUrl)) {
                        seenImageUrls.add(imageUrl);
                        deduplicatedMessages.push(msg);
                      }
                    }
                  });
                  
                  return deduplicatedMessages;
                })().map((msg) => (
                  <div key={msg.id} className="birthday-message">
                    <div className="message-author">From: {msg.name} 💕</div>
                    <div className="message-content">{msg.message}</div>
                    {(msg.image || msg.imageUrl) && (
                      <div className="message-image">
                        <img 
                          src={msg.imageUrl || msg.image} 
                          alt="Shared memory"
                          loading="lazy"
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                          onLoad={(e) => {
                            e.target.style.opacity = '1';
                            e.target.style.transition = 'opacity 0.3s ease-in-out';
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            console.log('Failed to load image:', msg.imageUrl || msg.image);
                          }}
                        />
                      </div>
                    )}
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button 
              className="back-button"
              onClick={() => setStep('welcome')}
            >
              ← Back to start
            </button>
          </div>
        ) : (
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`message ${msg.isUser ? 'user' : 'bot'}`}>
                <div className="message-bubble">
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*,image/heic,image/heif"
        style={{ display: 'none' }}
      />

      {/* Input Area */}
      {step !== 'view-messages' && (
        <div className="input-container">
          {step === 'welcome' && (
            <div className="response-buttons">
              <button 
                className="response-btn yes"
                onClick={() => handleNameResponse(true)}
              >
                Yes, that's me! 💕
              </button>
              <button 
                className="response-btn no"
                onClick={() => handleNameResponse(false)}
              >
                No, that's not me
              </button>
            </div>
          )}

          {step === 'name-check' && (
            <form onSubmit={handleNameSubmit} className="input-form">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name..."
                  className="text-input"
                  autoFocus
                />
                <button type="submit" className="send-btn">
                  ➤
                </button>
              </div>
            </form>
          )}

          {step === 'collect-message' && (
            <form onSubmit={handleMessageSubmit} className="input-form">
              <div className="input-wrapper">
                <textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Share your message or favorite memory..."
                  className="text-input message-input"
                  rows="3"
                  autoFocus
                />
                <button type="submit" className="send-btn">
                  ➤
                </button>
              </div>
            </form>
          )}

          {step === 'ask-another' && (
            <div className="response-buttons">
              <button 
                className="response-btn yes"
                onClick={() => handleAnotherMemory(true)}
              >
                Yes, I'd love to share another! 💕
              </button>
              <button 
                className="response-btn no"
                onClick={() => handleAnotherMemory(false)}
              >
                No, that's all for now 😊
              </button>
            </div>
          )}

          {step === 'ask-more-content' && (
            <div className="response-buttons">
              <button 
                className="response-btn yes"
                onClick={() => handleMoreContent('photo')}
              >
                📸 Share a Photo
              </button>
              <button 
                className="response-btn"
                onClick={() => handleMoreContent('message')}
              >
                📝 Write a Message
              </button>
              <button 
                className="response-btn no"
                onClick={() => handleMoreContent('done')}
              >
                ✨ All Done!
              </button>
            </div>
          )}

          {step === 'ask-picture' && (
            <div className="response-buttons">
              <button 
                className="response-btn yes"
                onClick={() => handlePictureResponse(true)}
              >
                Yes, I'd love to share a picture! 📸
              </button>
              <button 
                className="response-btn no"
                onClick={() => handlePictureResponse(false)}
              >
                No pictures this time 😊
              </button>
              {/* Fallback direct file input for mobile */}
              <label htmlFor="mobile-file-input" className="mobile-file-label">
                📷 Choose from Photos/Camera
              </label>
              <input
                id="mobile-file-input"
                type="file"
                onChange={handleImageSelect}
                accept="image/*,image/heic,image/heif"
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App